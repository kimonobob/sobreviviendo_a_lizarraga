import React from "react";
import { ResponsiveContainer } from "recharts";

// Envoltorio de gráfico. En pantalla usa ResponsiveContainer (mide el contenedor).
// Para impresión, si se pasan w/h fijos, renderiza el gráfico a tamaño exacto
// SIN medición asíncrona (evita que Recharts salga vacío al imprimir a PDF).
export function ChartBox({ w, h, children }) {
  if (w && h) {
    return React.cloneElement(children, { width: w, height: h });
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );
}
