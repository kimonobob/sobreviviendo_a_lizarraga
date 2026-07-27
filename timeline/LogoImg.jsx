import { useState } from "react";
import { LOGO_DIR } from "./timelineData";

const SKIP = new Set(["de", "del", "la", "el", "y", "&", "the", "co.", "s.a.a.", "s.a."]);

/** Iniciales de la marca, para cuando la imagen no carga. */
export function initials(label = "") {
  const words = label
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !SKIP.has(w.toLowerCase()));
  if (words.length === 0) return label.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const logoUrl = (src) => `${import.meta.env.BASE_URL || "/"}${LOGO_DIR}${src}`;

/**
 * Logo de una marca. Si el archivo falta o no carga (por ejemplo, tras
 * reemplazarlo por uno real con otra extensión), dibuja un monograma.
 */
export function LogoImg({ src, label, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`tl-logo-fallback ${className}`} title={label} aria-label={label} role="img">
        {initials(label)}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={logoUrl(src)}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
