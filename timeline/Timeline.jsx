import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EventPanel } from "./EventPanel";
import { MiniCard } from "./MiniCard";
import { Presentation } from "./Presentation";
import { useTimelineRail } from "./useTimelineRail";
import {
  CATEGORIES,
  ERAS,
  EVENTS,
  FIN_BY_YEAR,
  categoryById,
  categoryColor,
  eraOf,
} from "./timelineData";
import "./time.css";

const FIRST_YEAR = EVENTS[0].year;
const LAST_YEAR = EVENTS[EVENTS.length - 1].year;

/** Cuánto dura el relevo entre panels. Debe coincidir con tlPanelOut
 *  en time.css: si lo cambias aquí, cámbialo también allí. */
const PANEL_CROSS_MS = 360;

/* ── Grosor del eje ────────────────────────────────────────────────
   El eje de la línea es también un gráfico: su grosor en cada tramo es
   la escala de ingresos de ese año, así que la línea se engrosa de
   izquierda a derecha conforme Alicorp crece. Los hitos anteriores a
   2010 no tienen EEFF separados publicados y se dibujan con trazo
   punteado — no se inventa un grosor donde no hay dato. */
const REVENUES = Object.values(FIN_BY_YEAR).map((f) => f.ingresos);
const REV_MIN = Math.min(...REVENUES);
const REV_MAX = Math.max(...REVENUES);
const AXIS_MIN_PX = 4;
const AXIS_MAX_PX = 19;

function axisWidth(year) {
  const fin = FIN_BY_YEAR[year];
  if (!fin) return null;
  const t = (fin.ingresos - REV_MIN) / (REV_MAX - REV_MIN);
  return `${(AXIS_MIN_PX + t * (AXIS_MAX_PX - AXIS_MIN_PX)).toFixed(1)}px`;
}

export function Timeline() {
  const [hidden, setHidden] = useState([]);
  const [presenting, setPresenting] = useState(false);

  const visible = useMemo(
    () => EVENTS.filter((e) => !hidden.includes(e.category)),
    [hidden]
  );

  const years = useMemo(() => visible.map((e) => e.year), [visible]);

  const { railRef, trackRef, viewportRef, itemRef, centerYear, centerOn, stepBy } =
    useTimelineRail(years);

  const counts = useMemo(() => {
    const m = {};
    for (const e of EVENTS) m[e.category] = (m[e.category] ?? 0) + 1;
    return m;
  }, []);

  const selIndex = years.indexOf(centerYear);
  const activeEra = eraOf(centerYear);
  const activeEv = EVENTS.find((e) => e.year === centerYear) ?? EVENTS[0];

  /* ── Relevo del panel ──────────────────────────────────────────────
     Al cambiar de año el panel saliente se queda montado mientras dura
     el cruce, para que uno se disuelva sobre el otro en vez de cortar
     en seco. Los dos comparten casilla de rejilla: el que entra ocupa
     exactamente el sitio del que se va. */
  const [leavingYear, setLeavingYear] = useState(null);
  const shownRef = useRef(centerYear);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (shownRef.current === centerYear) return;
    setDir(centerYear > shownRef.current ? 1 : -1);
    setLeavingYear(shownRef.current);
    shownRef.current = centerYear;
    const t = setTimeout(() => setLeavingYear(null), PANEL_CROSS_MS);
    return () => clearTimeout(t);
  }, [centerYear]);

  const leavingEv =
    leavingYear == null ? null : EVENTS.find((e) => e.year === leavingYear);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        if (years[0]) centerOn(years[0]);
      } else if (e.key === "End") {
        e.preventDefault();
        if (years.length) centerOn(years[years.length - 1]);
      }
    },
    [centerOn, stepBy, years]
  );

  const toggleCat = (id) =>
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  const goToEra = (era) => {
    const target = visible.find((e) => e.year >= era.from && e.year <= era.to);
    if (target) centerOn(target.year);
  };

  // Al ocultar una categoría el año centrado puede desaparecer: el carril
  // se recoloca sobre el hito visible más próximo en vez de quedar en el aire.
  useEffect(() => {
    if (years.length === 0 || years.includes(centerYear)) return;
    const nearest = years.reduce((best, y) =>
      Math.abs(y - centerYear) < Math.abs(best - centerYear) ? y : best
    );
    centerOn(nearest);
  }, [years, centerYear, centerOn]);

  return (
    <div className="tl-screen">
      {/* Fondo. La ruta se pasa desde aquí y no desde el CSS para que
          respete el BASE_URL del despliegue. Todos los mandos —
          opacidad, velo, desvanecido — están en time.css. */}
      <div
        className="tl-bg"
        aria-hidden
        style={{
          "--tl-bg-src": `url("${import.meta.env.BASE_URL || "/"}timeline/time.png")`,
        }}
      />

      <div className="tl-head">
        <div>
          <span className="tl-eyebrow">
            {FIRST_YEAR}—{LAST_YEAR} · {EVENTS.length} hitos
          </span>
          <h2 className="tl-title">Evolución de Alicorp S.A.A.</h2>
          <p className="tl-sub">
            De una planta de aceites y jabones en el Callao a un grupo multilatino de consumo
            masivo, B2B y acuicultura. Las cifras son del EEFF <strong>separado</strong>,
            en S/ millones.
          </p>
        </div>
        <div className="tl-actions">
          <button
            type="button"
            className="tl-present"
            onClick={() => setPresenting(true)}
            title="Recorrer la línea de tiempo año por año, a pantalla completa"
          >
            ▶ Presentación
          </button>
          <div className="tl-filters">
            {CATEGORIES.map((c) => {
              const on = !hidden.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="tl-chip"
                  aria-pressed={on}
                  onClick={() => toggleCat(c.id)}
                  style={{ "--tl-chip": `var(${c.varName})` }}
                  title={`${on ? "Ocultar" : "Mostrar"} hitos de ${c.label.toLowerCase()}`}
                >
                  <span className="tl-chip-dot" />
                  {c.label}
                  <span className="tl-chip-count">{counts[c.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tl-eras">
        {ERAS.map((era) => (
          <button
            key={era.id}
            type="button"
            className="tl-era"
            data-active={era.id === activeEra.id}
            onClick={() => goToEra(era)}
            title={era.note}
          >
            <span className="tl-era-range">
              {era.from}–{era.to}
            </span>
            <span className="tl-era-label">{era.label}</span>
          </button>
        ))}
      </div>

      {/* El carril ocupa el hueco entero, como siempre. El panel no vive
          en el flujo: flota encima en su propia capa, así que la línea no
          se desplaza, no crece y no reserva sitio para él. */}
      <div className="tl-viewport" ref={viewportRef}>
        <button
          type="button"
          className="tl-nav tl-nav-prev"
          onClick={() => stepBy(-1)}
          disabled={selIndex <= 0}
          aria-label="Hito anterior"
          title="Hito anterior"
        >
          ←
        </button>
        <button
          type="button"
          className="tl-nav tl-nav-next"
          onClick={() => stepBy(1)}
          disabled={selIndex >= years.length - 1}
          aria-label="Hito siguiente"
          title="Hito siguiente"
        >
          →
        </button>

        <div
          className="tl-rail"
          ref={railRef}
          tabIndex={0}
          role="group"
          aria-label="Línea de tiempo de hitos de Alicorp"
          onKeyDown={onKeyDown}
        >
          {visible.length === 0 ? (
            <p className="tl-empty">
              Ningún hito coincide con los filtros. Vuelve a activar alguna categoría.
            </p>
          ) : (
            <div className="tl-track" ref={trackRef} role="list">
              {/* Recorrido de la línea: se llena conforme avanzas. */}
              <div className="tl-progress" aria-hidden>
                <span className="tl-progress-fill" />
              </div>

              {visible.map((ev, i) => {
                const selected = ev.year === centerYear;
                return (
                  <div
                    key={ev.year}
                    role="listitem"
                    ref={itemRef(ev.year)}
                    className="tl-item"
                    data-side={i % 2 === 0 ? "up" : "down"}
                    data-selected={selected}
                    data-scale={axisWidth(ev.year) ? "data" : "none"}
                    style={{
                      "--tl-cat": categoryColor(ev.category),
                      "--tl-w": axisWidth(ev.year) ?? undefined,
                    }}
                  >
                    {/* Tarjeta de contexto, alternando arriba y abajo. La del
                        año activo se retira hacia el eje: se convirtió en el
                        panel grande. */}
                    <div className="tl-cell">
                      <MiniCard ev={ev} onSelect={() => centerOn(ev.year)} />
                    </div>

                    <div className="tl-axis">
                      <button
                        type="button"
                        className="tl-node"
                        onClick={() => centerOn(ev.year)}
                        aria-current={selected}
                        title={`${ev.year} — ${ev.title}`}
                      >
                        {ev.year}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Capa flotante del hito activo. Los dos panels que puede haber a
            la vez —el que entra y el que sale— comparten la misma posición
            absoluta, así que el nuevo aparece justo donde estaba el otro. */}
        {visible.length > 0 && (
          <>
            {leavingEv && (
              <EventPanel key={`out-${leavingEv.year}`} ev={leavingEv} state="out" dir={dir} />
            )}
            <EventPanel key={activeEv.year} ev={activeEv} state="in" dir={dir} />
          </>
        )}
      </div>

      <div className="tl-hint">
        <span>
          <strong>El grosor del eje son los ingresos de ese año</strong> — el trazo punteado
          marca los hitos anteriores a 2010, sin EEFF separados publicados. Cada muesca de
          rueda avanza un año · <span className="tl-kbd">←</span>{" "}
          <span className="tl-kbd">→</span> también saltan
        </span>
        <span>
          Mostrando {visible.length} de {EVENTS.length} hitos · era actual: {activeEra.label}
        </span>
      </div>

      {/* En pantalla manda el panel, que muestra un año cada vez. En papel
          eso perdería 39 hitos, así que la impresión despliega la lista
          completa. */}
      <ol className="tl-print-list">
        {visible.map((ev) => (
          <li key={ev.year} style={{ "--tl-cat": categoryColor(ev.category) }}>
            <span className="tl-print-year">{ev.year}</span>
            <div>
              <span className="tl-cat">{categoryById(ev.category).label}</span>
              <h3>{ev.title}</h3>
              <p>{ev.text}</p>
              {ev.note && <p className="tl-print-note">{ev.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      {presenting && (
        <Presentation
          startIndex={Math.max(0, EVENTS.findIndex((e) => e.year === centerYear))}
          onClose={() => setPresenting(false)}
          onExitAt={(year) => centerOn(year)}
        />
      )}
    </div>
  );
}
