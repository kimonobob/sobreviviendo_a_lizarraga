import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { soles } from "../src/lib/format";
import { LogoImg } from "./LogoImg";
import {
  ALL_COUNTRIES,
  CATEGORIES,
  ERAS,
  EVENTS,
  FIN_BY_YEAR,
  categoryById,
  categoryColor,
  eraOf,
} from "./timelineData";
import "./slides.css";

/** Total de láminas: un año por lámina + el plano general al final. */
const TOTAL = EVENTS.length + 1;
const OVERVIEW = EVENTS.length;

/** Retardo de entrada, en milisegundos, como variable CSS. */
const at = (ms) => ({ "--d": `${ms}ms` });

/**
 * Foto de fondo del año: public/timeline/fondos/<año>.png
 * Si el archivo no existe, no se pinta nada y la lámina queda limpia.
 * La opacidad y el desenfoque se ajustan en slides.css (bloque de arriba).
 */
const bgUrl = (year) => `${import.meta.env.BASE_URL || "/"}timeline/fondos/${year}.png`;

function Stat({ label, value, negative = false, delay }) {
  return (
    <div className="sl-stat sl-fx-pop" style={at(delay)}>
      <span className="sl-stat-k">{label}</span>
      <span className="sl-stat-v" data-neg={negative}>
        {value}
      </span>
    </div>
  );
}

/** Lámina de un año. */
function EventSlide({ ev }) {
  const fin = FIN_BY_YEAR[ev.year];
  const words = ev.title.split(" ");

  // La cascada se arma de arriba abajo: cada bloque arranca donde terminó el anterior.
  // Los tiempos están calibrados para que todo asiente en ~1.5 s, sin estorbar
  // a quien avanza rápido.
  const tTitle = 190;
  const tUnderline = tTitle + words.length * 34 + 30;
  const tLead = tUnderline + 70;
  const tDetail = tLead + 80;
  const nDetail = ev.detail?.length ?? 0;
  const tNote = tDetail + nDetail * 70 + 50;
  const tTags = tNote + (ev.note ? 90 : 0);

  return (
    <>
      <div className="sl-aura" aria-hidden />
      <div className="sl-year-ghost" aria-hidden>
        {ev.year}
      </div>
      <div className="sl-grid">
        <div className="sl-main">
          <span className="sl-cat sl-fx-slide" style={at(60)}>
            {categoryById(ev.category).label}
          </span>
          <div className="sl-yearrow">
            <span className="sl-year" style={at(120)}>
              {ev.year}
            </span>
            <span className="sl-flags sl-fx-pop" style={at(300)}>
              {ev.flags.join(" ")}
            </span>
          </div>

          <h2 className="sl-title">
            {words.map((w, k) => (
              <span key={`${w}-${k}`} className="sl-w" style={at(tTitle + k * 34)}>
                {w}
              </span>
            ))}
          </h2>
          <div className="sl-underline" style={at(tUnderline)} aria-hidden />

          <p className="sl-lead sl-fx-rise" style={at(tLead)}>
            {ev.text}
          </p>

          {nDetail > 0 && (
            <ul className="sl-detail">
              {ev.detail.map((d, k) => (
                <li key={d} className="sl-fx-slide" style={at(tDetail + k * 70)}>
                  {d}
                </li>
              ))}
            </ul>
          )}

          {ev.note && (
            <p className="sl-note sl-fx-rise" style={at(tNote)}>
              <strong>Lectura financiera. </strong>
              {ev.note}
            </p>
          )}

          {ev.tags?.length > 0 && (
            <div className="sl-tags">
              {ev.tags.map((t, k) => (
                <span key={t} className="sl-tag sl-fx-pop" style={at(tTags + k * 45)}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <aside className="sl-side">
          {ev.images?.length > 0 && (
            <div className="sl-logos">
              {ev.images.map((img, k) => (
                <div key={img.src} className="sl-logo sl-fx-pop" style={at(300 + k * 80)}>
                  <LogoImg src={img.src} label={img.label} />
                </div>
              ))}
            </div>
          )}
          {fin && (
            <>
              <div className="sl-fin">
                <Stat label="Ingresos" value={soles(fin.ingresos)} delay={480} />
                <Stat label="U. operativa" value={soles(fin.operativa)} delay={550} />
                <Stat
                  label="U. neta"
                  value={soles(fin.neta)}
                  negative={fin.neta < 0}
                  delay={620}
                />
              </div>
              <p className="sl-fin-src sl-fx-rise" style={at(690)}>
                EEFF separado {ev.year} · S/ millones
              </p>
            </>
          )}
          {ev.countries?.length > 0 && (
            <div className="sl-countries sl-fx-rise" style={at(750)}>
              {ev.countries.map((c) => (
                <span key={c} className="sl-country">
                  {c}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

/** Última lámina: toda la línea de tiempo de un vistazo. */
function OverviewSlide({ onPick }) {
  const counts = useMemo(() => {
    const m = {};
    for (const e of EVENTS) m[e.category] = (m[e.category] ?? 0) + 1;
    return m;
  }, []);

  return (
    <div className="sl-overview">
      <div className="sl-aura" aria-hidden />
      <div className="sl-ov-head">
        <h2 className="sl-ov-title sl-fx-rise" style={at(60)}>
          Plano general — {EVENTS[0].year} a {EVENTS[EVENTS.length - 1].year}
        </h2>
        <p className="sl-ov-sub sl-fx-rise" style={at(150)}>
          {EVENTS.length} hitos · {ERAS.length} etapas · {ALL_COUNTRIES.length} países ·
          de una planta de aceites y jabones en el Callao a un grupo multilatino de consumo masivo,
          B2B y acuicultura.
        </p>
      </div>

      <div className="sl-ov-eras">
        {ERAS.map((era, col) => {
          const items = EVENTS.filter((e) => e.year >= era.from && e.year <= era.to);
          const base = 220 + col * 85;
          return (
            <section key={era.id} className="sl-ov-era sl-fx-pop" style={at(base)}>
              <span className="sl-ov-era-range">
                {era.from}–{era.to}
              </span>
              <h3 className="sl-ov-era-label">{era.label}</h3>
              <p className="sl-ov-era-note">{era.note}</p>
              <ul className="sl-ov-list">
                {items.map((e, k) => (
                  <li key={e.year} className="sl-fx-slide" style={at(base + 120 + k * 26)}>
                    <button
                      type="button"
                      className="sl-ov-item"
                      onClick={() => onPick(EVENTS.indexOf(e))}
                      title={`Ir a ${e.year}`}
                    >
                      <span
                        className="sl-ov-dot"
                        style={{ "--sl-dot": categoryColor(e.category) }}
                      />
                      <span className="sl-ov-year">{e.year}</span>
                      <span className="sl-ov-item-title">{e.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="sl-ov-legend sl-fx-rise" style={at(780)}>
        {CATEGORIES.map((c) => (
          <span key={c.id} className="sl-ov-leg">
            <span className="sl-ov-dot" style={{ "--sl-dot": `var(${c.varName})` }} />
            {c.label} <b>{counts[c.id] ?? 0}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Presentación a pantalla completa: una lámina por año y, al final,
 * el plano general de toda la línea de tiempo.
 */
export function Presentation({ startIndex = 0, onClose, onExitAt }) {
  const rootRef = useRef(null);
  const [i, setI] = useState(() => Math.min(Math.max(startIndex, 0), TOTAL - 1));
  const [fs, setFs] = useState(false);
  // +1 avanzando, -1 retrocediendo: define hacia dónde entra el contenido.
  const [dir, setDir] = useState(1);

  const ev = i < OVERVIEW ? EVENTS[i] : null;
  const accent = ev ? categoryColor(ev.category) : "var(--brand)";

  /** Salta a una lámina concreta, deduciendo la dirección de la animación. */
  const goTo = useCallback((target) => {
    setI((v) => {
      const n = Math.min(TOTAL - 1, Math.max(0, target));
      if (n !== v) setDir(n > v ? 1 : -1);
      return n;
    });
  }, []);

  const next = useCallback(() => {
    setDir(1);
    setI((v) => Math.min(TOTAL - 1, v + 1));
  }, []);

  const prev = useCallback(() => {
    setDir(-1);
    setI((v) => Math.max(0, v - 1));
  }, []);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    onExitAt?.(i < OVERVIEW ? EVENTS[i].year : EVENTS[EVENTS.length - 1].year);
    onClose();
  }, [i, onClose, onExitAt]);

  // El teclado maneja toda la navegación mientras la presentación está abierta.
  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowRight", "PageDown", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(TOTAL - 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, close]);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    const sync = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const era = ev ? eraOf(ev.year) : null;

  // Los controles no retienen el foco: si no, la barra espaciadora los reactivaría
  // además de avanzar la lámina.
  const noFocus = (e) => e.preventDefault();

  // Va al <body>: el contenedor del rail tiene un transform de animación y eso
  // convertiría el `position: fixed` del overlay en relativo a ese contenedor.
  return createPortal(
    <div
      ref={rootRef}
      className="sl-overlay"
      data-dir={dir}
      style={{ "--sl-cat": accent }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Presentación de la línea de tiempo de Alicorp"
    >
      {ev && (
        <>
          <div
            key={`bg-${ev.year}`}
            className="sl-bg"
            style={{ backgroundImage: `url("${bgUrl(ev.year)}")` }}
            aria-hidden
          />
          <div className="sl-scrim" aria-hidden />
        </>
      )}

      <div className="sl-bar">
        <span className="sl-brand">
          <img
            className="sl-brand-mark"
            src={`${import.meta.env.BASE_URL || "/"}logo-alicorp.png`}
            alt=""
          />
          Alicorp S.A.A. · Línea de tiempo
        </span>
        {era && (
          <span className="sl-era-pill">
            {era.from}–{era.to} · {era.label}
          </span>
        )}
        <span className="sl-bar-right">
          <span className="sl-count">
            {i + 1} / {TOTAL}
          </span>
          <button type="button" className="sl-btn" onClick={toggleFullscreen}>
            {fs ? "⤡ Salir de pantalla completa" : "⤢ Pantalla completa"}
          </button>
          <button type="button" className="sl-btn" onClick={close}>
            ✕ Salir
          </button>
        </span>
      </div>

      <div className="sl-stage" data-overview={!ev} key={i}>
        {ev ? <EventSlide ev={ev} /> : <OverviewSlide onPick={goTo} />}
      </div>

      <button
        type="button"
        className="sl-arrow sl-arrow-prev"
        onClick={prev}
        onMouseDown={noFocus}
        disabled={i === 0}
        aria-label="Lámina anterior"
      >
        ‹
      </button>
      <button
        type="button"
        className="sl-arrow sl-arrow-next"
        onClick={next}
        onMouseDown={noFocus}
        disabled={i === TOTAL - 1}
        aria-label="Lámina siguiente"
      >
        ›
      </button>

      <div className="sl-foot">
        <div className="sl-progress">
          {Array.from({ length: TOTAL }, (_, k) => {
            const e = k < OVERVIEW ? EVENTS[k] : null;
            return (
              <button
                key={k}
                type="button"
                className="sl-seg"
                data-current={k === i}
                data-done={k < i}
                onClick={() => goTo(k)}
                onMouseDown={noFocus}
                style={{ "--sl-seg": e ? categoryColor(e.category) : "var(--text-muted)" }}
                title={e ? `${e.year} — ${e.title}` : "Plano general"}
                aria-label={e ? `Ir al año ${e.year}` : "Ir al plano general"}
              />
            );
          })}
        </div>
        <div className="sl-foot-row">
          <span>
            <span className="sl-kbd">→</span> siguiente · <span className="sl-kbd">←</span> anterior ·{" "}
            <span className="sl-kbd">Esc</span> salir
          </span>
          <span>
            {i < OVERVIEW
              ? `Hito ${i + 1} de ${EVENTS.length} · siguiente: ${
                  i + 1 < OVERVIEW ? EVENTS[i + 1].year : "plano general"
                }`
              : "Fin del recorrido — haz clic en cualquier hito para volver a él"}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
