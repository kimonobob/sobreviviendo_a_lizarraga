// Paleta categórica validada (CVD-safe en claro y oscuro).
// El orden es el mecanismo de seguridad — no reordenar sin re-validar.
// Se leen como variables CSS para respetar el tema activo.

export const SERIES_VARS = [
  "--series-1", // rojo Alicorp (protagonista)
  "--series-2", // azul
  "--series-3", // verde
  "--series-4", // ámbar
  "--series-5", // aqua
  "--series-6", // violeta
  "--series-7", // naranja
];

export const seriesColor = (i) => `var(${SERIES_VARS[i % SERIES_VARS.length]})`;

// Colores por rol (chrome de gráfico)
export const ink = {
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted: "var(--text-muted)",
  grid: "var(--gridline)",
  baseline: "var(--baseline)",
  surface: "var(--surface-1)",
  brand: "var(--brand)",
};

export const flow = {
  up: "var(--flow-up)",
  down: "var(--flow-down)",
  total: "var(--flow-total)",
};

// Rampa secuencial (magnitud) para el Marimekko: bloques por lado usan
// una intensidad ordenada dentro de su columna.
export const seq = ["var(--seq-soft)", "var(--seq-mid)", "var(--seq-strong)"];

// Degradados vibrantes para el radial del Estado de Situación Financiera.
// morado · fucsia · rosa · naranja · violeta (orden de los 5 bloques del ESF).
export const BALANCE_BLOCKS = [
  { id: "activo_corriente", label: "Activo Corriente", g: ["#7c3aed", "#a855f7"], solid: "#8b3ff0" },
  { id: "activo_no_corriente", label: "Activo No Corriente", g: ["#c026d3", "#f0abfc"], solid: "#d21fd8" },
  { id: "pasivo_corriente", label: "Pasivo Corriente", g: ["#ec4899", "#f9a8d4"], solid: "#f0509b" },
  { id: "pasivo_no_corriente", label: "Pasivo No Corriente", g: ["#f97316", "#fdba74"], solid: "#fb8024" },
  { id: "patrimonio", label: "Patrimonio", g: ["#6d28d9", "#8b5cf6"], solid: "#7c4ddb" },
];
export const balanceBlock = (id) => BALANCE_BLOCKS.find((b) => b.id === id);

// Asignación fija de color por serie del Estado de Resultados
export const ER_SERIES = [
  { id: "ingresos", label: "Ingresos", varName: "--series-1" },
  { id: "utilidad_bruta", label: "Utilidad bruta", varName: "--series-2" },
  { id: "utilidad_operativa", label: "Utilidad operativa", varName: "--series-4" },
  { id: "utilidad_neta", label: "Utilidad neta", varName: "--series-6" },
];
