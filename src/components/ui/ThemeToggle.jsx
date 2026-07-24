import { useEffect, useState } from "react";

// Conmuta claro/oscuro escribiendo data-theme en <html> (persistente).
export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem("alicorp-theme", dark ? "dark" : "light");
    } catch (e) {
      /* almacenamiento no disponible */
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-hair bg-surface text-ink-secondary hover:text-brand"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}
