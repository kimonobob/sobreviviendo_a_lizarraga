import { useMemo, useState } from "react";
import {
  EVENTS,
  MARK_BG,
  categoryById,
  categoryColor,
  eraOf,
} from "../../timeline/timelineData";
import { logoUrl } from "../../timeline/LogoImg";

/**
 * Marca de agua del año: el logo, grande y por detrás del texto.
 *
 * Toma la primera imagen del hito salvo que este diga otra con `markSrc`.
 * `object-contain` lo encaja entero en la tarjeta sin recortarlo, y la
 * opacidad la manda MARK_BG (o `markOpacity` del propio año). Va marcada
 * como decorativa y sin eventos: nunca se interpone con el texto ni con el
 * clic que amplía la tarjeta. Un archivo que falte no deja hueco.
 * Ver el bloque "MARCA DE AGUA" en timelineData.js.
 */
function MilestoneWatermark({ ev }) {
  // Keyed por año desde MilestoneSlide, así el estado arranca limpio en
  // cada hito. Si el logo de la marca no carga (p. ej. 2015, que no tiene
  // archivo propio), se cae al logo del grupo para que la tarjeta nunca
  // quede sin imagen de marca.
  const [src, setSrc] = useState(() => ev?.markSrc ?? ev?.images?.[0]?.src ?? null);
  if (!src) return null;
  return (
    <img
      src={logoUrl(src)}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => {
        if (src !== "alicorp.png") setSrc("alicorp.png");
      }}
      className="milestone-mark pointer-events-none absolute inset-4 m-auto h-auto max-h-[85%] w-auto max-w-[85%] select-none object-contain"
      style={{ opacity: ev.markOpacity ?? MARK_BG.opacity }}
    />
  );
}

/**
 * La lámina de la presentación, proyectada dentro de una tarjeta del dashboard.
 *
 * Es la misma información que la lámina a pantalla completa —categoría, título,
 * relato, viñetas, lectura financiera y etiquetas— pero sin las marcas: en una
 * tarjeta de ~300 px los logotipos se comen el sitio que necesita el texto.
 * El año manda: la lámina sigue al año marcado en el dashboard.
 *
 * Las viñetas son la única parte que crece, así que son las que llevan el
 * scroll; el resto queda anclado para que la tarjeta nunca desborde.
 */
export function MilestoneSlide({ year, title, subtitle, onPresent }) {
  const ev = useMemo(() => EVENTS.find((e) => e.year === year), [year]);
  const era = eraOf(year);
  const accent = ev ? categoryColor(ev.category) : "var(--brand)";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Cabecera al estilo del resto de paneles de esta vista: título a la
          izquierda, mando a la derecha. */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          {title && (
            <h2 className="shrink-0 truncate text-[10px] font-semibold uppercase tracking-wide text-ink">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="truncate text-[9px] leading-snug text-ink-secondary">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onPresent}
          className="shrink-0 rounded border border-hair bg-surface px-2 py-1 text-[9px] font-medium text-ink-secondary transition-colors hover:border-brand hover:text-brand"
          title={`Ver la presentación a pantalla completa desde ${year}`}
        >
          ▶ Presentar
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-hair bg-plane px-3 py-2.5"
        style={{ borderTopColor: accent, borderTopWidth: 2 }}
      >
        {/* El logo del año hace de fondo: ocupa la tarjeta entera por detrás
            del texto. Sustituye al año en grande que había aquí — dos marcas
            de agua superpuestas solo ensucian. */}
        <MilestoneWatermark key={year} ev={ev} />

        {ev ? (
          <>
            <div className="relative flex shrink-0 flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                  color: accent,
                }}
              >
                {categoryById(ev.category).label}
              </span>
              <span className="text-[11px] leading-none">{ev.flags.join(" ")}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wide text-ink-muted">
                {era.from}–{era.to} · {era.label}
              </span>
            </div>

            <h3 className="relative mt-1.5 shrink-0 text-[13px] font-semibold leading-snug text-ink">
              {ev.title}
            </h3>
            <span
              aria-hidden
              className="mt-1 h-[2px] w-10 shrink-0 rounded-full"
              style={{ background: accent }}
            />

            <p className="relative mt-1.5 shrink-0 text-[11px] leading-snug text-ink-secondary line-clamp-3">
              {ev.text}
            </p>

            {/* Máx. 3 viñetas: la tarjeta es pequeña y más detalle la
                desborda y deforma el dashboard. El resto vive en la
                presentación a pantalla completa. */}
            {ev.detail?.length > 0 && (
              <ul className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
                {ev.detail.slice(0, 3).map((d) => (
                  <li key={d} className="flex items-start gap-1.5 text-[10px] leading-snug text-ink-secondary">
                    <span
                      className="mt-[5px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: accent }}
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}

            {ev.note && (
              <p className="relative mt-1.5 shrink-0 border-t border-hair pt-1.5 text-[10px] leading-snug text-ink-muted line-clamp-2">
                <strong className="font-semibold text-ink-secondary">Lectura financiera. </strong>
                {ev.note}
              </p>
            )}

            {ev.tags?.length > 0 && (
              <div className="relative mt-1.5 flex shrink-0 flex-wrap gap-1">
                {ev.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-hair bg-surface px-1.5 py-0.5 text-[9px] text-ink-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="relative m-auto text-center text-[11px] leading-snug text-ink-secondary">
            {year} no tiene un hito propio en la línea de tiempo.
            <br />
            <span className="text-ink-muted">La presentación arranca en el más cercano.</span>
          </p>
        )}
      </div>
    </div>
  );
}
