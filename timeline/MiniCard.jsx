import { LogoImg } from "./LogoImg";
import { categoryById } from "./timelineData";

/* ══════════════════════════════════════════════════════════════════
   Tarjeta de contexto
   ══════════════════════════════════════════════════════════════════
   La versión pequeña de un hito, anclada a su año en el carril. Su
   trabajo no es que se lea entero, sino que se vea que ahí pasó algo:
   categoría, titular y las marcas implicadas.

   Van pegadas al borde exterior de su carril — arriba del todo las de
   la fila superior, abajo del todo las de la inferior — y no junto al
   eje. Así el panel grande cabe en la banda central sin tapar ni una
   sola tarjeta de contexto.

   El año activo no dibuja la suya: se convirtió en el panel. Ese salto
   lo anima el CSS con `[data-selected]`.
   ══════════════════════════════════════════════════════════════════ */
export function MiniCard({ ev, onSelect }) {
  const cat = categoryById(ev.category);

  return (
    <article
      className="tl-mini"
      onClick={onSelect}
      title={`${ev.year} — ${ev.title}`}
    >
      <div className="tl-mini-top">
        <span className="tl-mini-cat">{cat.label}</span>
        <span className="tl-mini-flags">{ev.flags.join(" ")}</span>
      </div>

      <h3 className="tl-mini-title">{ev.title}</h3>

      {ev.images?.length > 0 && (
        <div className="tl-mini-thumbs" data-count={Math.min(ev.images.length, 3)}>
          {ev.images.slice(0, 3).map((img) => (
            <span key={img.src} className="tl-mini-thumb">
              <LogoImg src={img.src} label={img.label} />
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
