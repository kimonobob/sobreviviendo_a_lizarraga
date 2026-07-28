import { soles } from "../src/lib/format";
import { LogoImg } from "./LogoImg";
import { FIN_BY_YEAR, categoryById } from "./timelineData";

/* ══════════════════════════════════════════════════════════════════
   Panel del hito activo
   ══════════════════════════════════════════════════════════════════
   Ya no cuelga de su año: vive en el centro de la pantalla, en una
   zona que le pertenece en exclusiva. El carril navega, el panel se
   lee.

   Solo hay dos panels montados a la vez como mucho — el que entra y el
   que se va — y los dos ocupan la misma casilla de rejilla, así que la
   posición es idéntica pase lo que pase con el contenido.

   `state` decide la animación:
     "in"  el que entra, con rebote
     "out" el que se retira, sin interacción
   `dir` es el sentido del viaje (+1 hacia el futuro), para que el panel
   entre desde el lado del que vienes.
   ══════════════════════════════════════════════════════════════════ */

/** Retardos de la cascada interna, en milisegundos. */
const STAGGER = {
  head: 0,
  title: 55,
  text: 110,
  tags: 165,
  logos: 85,
  fin: 140,
  note: 195,
};

const delay = (ms) => ({ "--d": `${ms}ms` });

function FinStrip({ year, style }) {
  const fin = FIN_BY_YEAR[year];
  if (!fin) return null;
  return (
    <div className="tl-fin" style={style}>
      <div className="tl-fin-item">
        <span className="tl-fin-k">Ingresos</span>
        <span className="tl-fin-v">{soles(fin.ingresos)}</span>
      </div>
      <div className="tl-fin-item">
        <span className="tl-fin-k">U. operativa</span>
        <span className="tl-fin-v">{soles(fin.operativa)}</span>
      </div>
      <div className="tl-fin-item">
        <span className="tl-fin-k">U. neta</span>
        <span className="tl-fin-v" data-neg={fin.neta < 0}>
          {soles(fin.neta)}
        </span>
      </div>
    </div>
  );
}

export function EventPanel({ ev, state = "in", dir = 1 }) {
  const cat = categoryById(ev.category);
  const fin = FIN_BY_YEAR[ev.year];

  return (
    <article
      className="tl-panel"
      data-state={state}
      style={{ "--tl-cat": `var(${cat.varName})`, "--tl-dir": dir }}
      aria-hidden={state === "out"}
      aria-live={state === "in" ? "polite" : undefined}
    >
      <div className="tl-panel-head" style={delay(STAGGER.head)}>
        <span className="tl-panel-year">{ev.year}</span>
        <span className="tl-cat">{cat.label}</span>
        <span className="tl-flags">{ev.flags.join(" ")}</span>
      </div>

      <div className="tl-panel-body">
        <div className="tl-panel-main">
          <h3 className="tl-panel-title" style={delay(STAGGER.title)}>
            {ev.title}
          </h3>

          <p className="tl-panel-text" style={delay(STAGGER.text)}>
            {ev.text}
          </p>

          {ev.tags?.length > 0 && (
            <div className="tl-tags" style={delay(STAGGER.tags)}>
              {ev.tags.map((t) => (
                <span key={t} className="tl-tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          {ev.note && (
            <p className="tl-note" style={delay(STAGGER.note)}>
              {ev.note}
            </p>
          )}
        </div>

        <aside className="tl-panel-side">
          {ev.images?.length > 0 && (
            <div
              className="tl-thumbs"
              data-count={Math.min(ev.images.length, 4)}
              style={delay(STAGGER.logos)}
            >
              {ev.images.slice(0, 4).map((img) => (
                <span key={img.src} className="tl-thumb">
                  <LogoImg src={img.src} label={img.label} />
                </span>
              ))}
            </div>
          )}

          <FinStrip year={ev.year} style={delay(STAGGER.fin)} />
          {fin && (
            <p className="tl-panel-src" style={delay(STAGGER.fin)}>
              EEFF separado · S/ millones
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
