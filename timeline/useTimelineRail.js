import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════════════
   Motor del carril horizontal
   ══════════════════════════════════════════════════════════════════
   Reúne todo lo que se mueve: el desplazamiento, el reparto del foco
   entre años, la rueda del mouse y la aparición de las tarjetas. La
   pantalla (Timeline.jsx) solo compone; aquí está el comportamiento.

   Tres decisiones sostienen el rendimiento:

   1. La geometría se mide UNA vez por disposición, no en cada cuadro.
      Cada año guarda su centro en coordenadas de desplazamiento, así
      que saber cuál está en el medio es aritmética sobre `scrollLeft`
      — cero lecturas de diseño mientras se navega.

   2. Solo se escribe en el DOM lo que cambió. Un año que ya estaba en
      cero se queda como está.

   3. El desplazamiento es independiente de los fotogramas: la fracción
      que se recorre en cada cuadro se corrige por el tiempo real
      transcurrido, así que se siente igual a 60 que a 144 Hz.
   ══════════════════════════════════════════════════════════════════ */

/** Mínimo entre muescas de rueda. Los trackpads emiten decenas de
 *  eventos por gesto; sin esto la línea saldría disparada. */
const WHEEL_COOLDOWN_MS = 90;

/** Fracción de la distancia restante que se cubre en un cuadro a 60 Hz.
 *  Más bajo = más largo y suave; más alto = más seco. */
const GLIDE_EASE = 0.14;

/** Hasta dónde llega el halo de foco, en anchos de casilla. Con 1.15 el
 *  año vecino ya está prácticamente en reposo: solo el centro manda. */
const FOCUS_SPREAD = 1.15;

/** Curva de suavizado del foco: entra y sale sin aristas. */
const smoothstep = (t) => t * t * (3 - 2 * t);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {number[]} years Años visibles, en orden. Cambia con los filtros.
 */
export function useTimelineRail(years) {
  const railRef = useRef(null);
  const trackRef = useRef(null);
  // Contenedor que envuelve carril y panel. La rueda se escucha aquí y no
  // en el carril: el panel flota por encima y, escuchando abajo, girar la
  // rueda sobre el panel no movería la línea.
  const viewportRef = useRef(null);

  const itemsRef = useRef(new Map()); // año -> elemento
  const refCbsRef = useRef(new Map()); // año -> callback estable de ref
  const geomRef = useRef([]); // [{ year, el, center }]
  const paintedRef = useRef(new Map()); // año -> último foco escrito
  const progressRef = useRef(-1);

  // El año al que vamos, que no es el que se ve centrado ahora: mientras
  // el carril se desliza, el centro visual va por detrás. Contar los
  // pasos desde el centro visual hace que avance menos de lo que se gira.
  const aimRef = useRef(years[0]);
  const yearsRef = useRef(years);

  const targetRef = useRef(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastStepRef = useRef(0);

  const [centerYear, setCenterYear] = useState(years[0]);

  useEffect(() => {
    yearsRef.current = years;
    if (years.length && !years.includes(aimRef.current)) aimRef.current = years[0];
  }, [years]);

  /* ── Registro de los años ────────────────────────────────────────
     Un callback estable por año: si se creara uno nuevo en cada render,
     React desmontaría y remontaría la referencia constantemente. */
  const itemRef = useCallback((year) => {
    let cb = refCbsRef.current.get(year);
    if (!cb) {
      cb = (el) => {
        if (el) itemsRef.current.set(year, el);
        else {
          itemsRef.current.delete(year);
          paintedRef.current.delete(year);
        }
      };
      refCbsRef.current.set(year, cb);
    }
    return cb;
  }, []);

  /* ── Medición ────────────────────────────────────────────────────
     `offsetLeft` va contra .tl-track, que es el contenido desplazable:
     el número que sale ya está en coordenadas de `scrollLeft`. */
  const measure = useCallback(() => {
    const list = [];
    for (const year of yearsRef.current) {
      const el = itemsRef.current.get(year);
      if (!el) continue;
      list.push({ year, el, center: el.offsetLeft + el.offsetWidth / 2 });
    }
    geomRef.current = list;
  }, []);

  /* ── Reparto del foco ────────────────────────────────────────────
     Cada año recibe un valor de 0 a 1 según lo cerca que esté del
     centro. El CSS lo convierte en escala y presencia. Al ser continuo,
     la tarjeta se abre mientras te desplazas y se repliega al pasar de
     largo, sin que haya que apuntarle con el cursor. */
  const paint = useCallback(() => {
    const rail = railRef.current;
    const geom = geomRef.current;
    if (!rail || geom.length === 0) return;

    const view = rail.clientWidth;
    const mid = rail.scrollLeft + view / 2;
    const spread = (geom[0].el.offsetWidth || view) * FOCUS_SPREAD;

    let best = null;
    let bestDist = Infinity;

    for (const g of geom) {
      const dist = Math.abs(g.center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = g.year;
      }

      const t = dist >= spread ? 0 : smoothstep(1 - dist / spread);
      const v = t.toFixed(3);
      if (paintedRef.current.get(g.year) === v) continue;
      paintedRef.current.set(g.year, v);

      g.el.style.setProperty("--tl-focus", v);
      // `will-change` solo donde de verdad hay movimiento: aplicarlo a
      // todos crearía una capa de composición por año.
      if (t === 0) delete g.el.dataset.near;
      else g.el.dataset.near = "true";
    }

    // Recorrido de la línea, para la barra de progreso del eje.
    const max = rail.scrollWidth - view;
    const p = max > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / max)) : 0;
    if (Math.abs(p - progressRef.current) > 0.001) {
      progressRef.current = p;
      trackRef.current?.style.setProperty("--tl-progress", p.toFixed(4));
    }

    if (best == null) return;
    // Con el carril quieto el destino vuelve a ser lo que se ve: así un
    // arrastre con el dedo deja la cuenta de la rueda donde corresponde.
    if (targetRef.current == null) aimRef.current = best;
    setCenterYear((y) => (y === best ? y : best));
  }, []);

  /* ── Deslizamiento ───────────────────────────────────────────────
     El carril persigue un destino y cada cuadro cubre una fracción de
     lo que le falta: arranca rápido y frena solo, sin final abrupto. */
  const glideTo = useCallback((x) => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    targetRef.current = Math.min(max, Math.max(0, x));

    if (prefersReducedMotion()) {
      rail.scrollLeft = targetRef.current;
      targetRef.current = null;
      return;
    }
    if (rafRef.current) return; // ya hay un cuadro en marcha

    lastFrameRef.current = 0;
    const frame = (now) => {
      const r = railRef.current;
      if (!r || targetRef.current == null) {
        rafRef.current = 0;
        return;
      }
      // Corrección por tiempo real: la misma sensación a 60 y a 144 Hz.
      const prev = lastFrameRef.current || now;
      lastFrameRef.current = now;
      const dt = Math.min(64, now - prev);
      const k = 1 - Math.pow(1 - GLIDE_EASE, dt / 16.667);

      const diff = targetRef.current - r.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        r.scrollLeft = targetRef.current;
        targetRef.current = null;
        rafRef.current = 0;
        return;
      }
      r.scrollLeft += diff * k;
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  /** Deja un año exactamente en el centro del carril. */
  const centerOn = useCallback(
    (year) => {
      const rail = railRef.current;
      const g = geomRef.current.find((x) => x.year === year);
      if (!rail || !g) return;
      aimRef.current = year;
      glideTo(g.center - rail.clientWidth / 2);
    },
    [glideTo]
  );

  /** Avanza n años desde el destino actual (no desde el centro visual). */
  const stepBy = useCallback(
    (delta) => {
      const list = yearsRef.current;
      if (list.length === 0) return;
      const from = list.indexOf(aimRef.current);
      const next = Math.min(
        list.length - 1,
        Math.max(0, (from === -1 ? 0 : from) + delta)
      );
      centerOn(list[next]);
    },
    [centerOn]
  );

  /* ── Rueda: una muesca, un año ───────────────────────────────────
     Si la rueda empujara píxeles, un giro corto no llegaría a cruzar la
     mitad del año siguiente y el remate lo devolvería al de partida:
     avanzaría y volvería. Eligiendo el año, un toque siempre avanza uno
     y se queda donde lo dejaste. */
  useEffect(() => {
    const host = viewportRef.current ?? railRef.current;
    if (!host) return;

    const onWheel = (e) => {
      if (e.ctrlKey) return; // zoom del navegador
      const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!raw) return;

      const list = yearsRef.current;
      if (list.length === 0) return;
      const from = list.indexOf(aimRef.current);
      const next = (from === -1 ? 0 : from) + (raw > 0 ? 1 : -1);
      // en los extremos la rueda vuelve a ser de la página
      if (next < 0 || next >= list.length) return;

      e.preventDefault();
      const now = e.timeStamp || performance.now();
      if (now - lastStepRef.current < WHEEL_COOLDOWN_MS) return;
      lastStepRef.current = now;
      centerOn(list[next]);
    };

    // React monta 'wheel' como pasivo: hay que registrarlo a mano para
    // poder cancelar el desplazamiento vertical de la página.
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [centerOn]);

  /* ── Ciclo de vida: medir, pintar, re-medir cuando cambie el sitio ── */
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        paint();
      });
    };

    const relayout = () => {
      measure();
      paint();
    };

    relayout();
    rail.addEventListener("scroll", onScroll, { passive: true });

    // El carril cambia de tamaño con la ventana, con el panel lateral y
    // con los filtros: un observador cubre los tres casos.
    const ro = new ResizeObserver(relayout);
    ro.observe(rail);
    if (trackRef.current) ro.observe(trackRef.current);

    return () => {
      cancelAnimationFrame(raf);
      rail.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [measure, paint, years]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { railRef, trackRef, viewportRef, itemRef, centerYear, centerOn, stepBy };
}
