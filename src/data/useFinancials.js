import { useEffect, useState } from "react";

// Carga alicorp.json (fuente única de datos). base URL respeta el deploy.
export function useFinancials() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const url = `${import.meta.env.BASE_URL}data/alicorp.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar los datos (${r.status})`);
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}
