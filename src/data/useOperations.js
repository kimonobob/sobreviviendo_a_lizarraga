import { useEffect, useState } from "react";

// Carga el JSON de operaciones por país y la geometría de las Américas
// (Natural Earth, servida localmente desde public/data). Mismo patrón que
// useFinancials: fetch relativo a BASE_URL, sin CDN en runtime.
export function useOperations() {
  const [ops, setOps] = useState(null);
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/alicorp_operaciones_pais.json`).then((r) => {
        if (!r.ok) throw new Error(`operaciones (${r.status})`);
        return r.json();
      }),
      fetch(`${base}data/geo-americas.json`).then((r) => {
        if (!r.ok) throw new Error(`geografía (${r.status})`);
        return r.json();
      }),
    ])
      .then(([o, g]) => {
        if (!alive) return;
        setOps(o);
        setGeo(g);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return { ops, geo, error };
}
