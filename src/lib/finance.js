// Derivados de análisis a partir del JSON (fiel al Excel). Los montos siguen
// en miles de soles. Los ratios NO se recalculan: se transportan de la hoja.

const z = (v) => (v == null ? 0 : v);

// ---- lookups ---------------------------------------------------------------
export function erLine(data, id) {
  return data.er.lineas.find((l) => l.id === id) || null;
}
export function erVals(data, id) {
  const l = erLine(data, id);
  return l ? l.values : [];
}
export function block(data, id) {
  return data.esf.bloques.find((b) => b.id === id) || null;
}
export function ratioItem(data, id) {
  for (const g of data.ratios.grupos) {
    const it = g.items.find((i) => i.id === id);
    if (it) return it;
  }
  return null;
}
export const yearIndex = (data, year) => data.meta.years.indexOf(year);

// ---- cascada del Estado de Resultados (año seleccionado) --------------------
const ANCHORS = new Set([
  "ingresos",
  "utilidad_bruta",
  "utilidad_operativa",
  "utilidad_neta",
]);

export function waterfall(data, i) {
  const v = (id) => z(erVals(data, id)[i]);
  const steps = [
    { id: "ingresos", label: "Ingresos", value: v("ingresos") },
    { id: "costo_ventas", label: "Costo de ventas", value: v("costo_ventas") },
    { id: "utilidad_bruta", label: "Utilidad bruta", value: v("utilidad_bruta") },
    {
      id: "gastos_op",
      label: "Gastos operativos",
      value:
        v("gastos_venta") +
        v("gastos_admin") +
        v("derivados_mp") +
        v("otros_ingresos_gastos"),
    },
    { id: "utilidad_operativa", label: "Utilidad operativa", value: v("utilidad_operativa") },
    {
      id: "financiero",
      label: "Resultado financiero",
      value:
        v("ingresos_financieros") +
        v("gastos_financieros") +
        v("diferencia_cambio") +
        v("perdida_derivados"),
    },
    { id: "part_subsidiarias", label: "Part. subsidiarias", value: v("part_subsidiarias") },
    {
      id: "impuesto",
      label: "Impuesto y otros",
      value: v("impuesto") + v("discontinuadas"),
    },
    { id: "utilidad_neta", label: "Utilidad neta", value: v("utilidad_neta") },
  ];

  let cumul = 0;
  return steps.map((s) => {
    const anchor = ANCHORS.has(s.id);
    if (anchor) {
      const row = {
        ...s,
        kind: "anchor",
        base: Math.min(0, s.value),
        span: Math.abs(s.value),
        top: Math.max(0, s.value),
        cumul: s.value,
      };
      cumul = s.value;
      return row;
    }
    const prev = cumul;
    const next = cumul + s.value;
    cumul = next;
    return {
      ...s,
      kind: s.value >= 0 ? "up" : "down",
      base: Math.min(prev, next),
      span: Math.abs(s.value),
      top: Math.max(prev, next),
      cumul: next,
    };
  });
}

// ---- composición de la utilidad neta (holding vs. operación) ---------------
// operativo + financiero + subsidiarias + impuesto + discontinuadas = utilidad neta
export function earningsComposition(data) {
  return data.meta.years.map((year, i) => {
    const v = (id) => z(erVals(data, id)[i]);
    const operativo = v("utilidad_operativa");
    const financiero =
      v("ingresos_financieros") +
      v("gastos_financieros") +
      v("diferencia_cambio") +
      v("perdida_derivados");
    const subsidiarias = v("part_subsidiarias");
    const impuesto = v("impuesto");
    const discontinuadas = v("discontinuadas");
    return {
      year,
      operativo,
      financiero,
      subsidiarias,
      impuesto,
      discontinuadas,
      neta: operativo + financiero + subsidiarias + impuesto + discontinuadas,
    };
  });
}

// ---- crecimiento YoY de ingresos ------------------------------------------
export function revenueYoY(data) {
  const ing = erVals(data, "ingresos");
  return data.meta.years.map((year, i) => ({
    year,
    ingresos: ing[i],
    yoy: i === 0 || ing[i - 1] == null ? null : (ing[i] - ing[i - 1]) / ing[i - 1],
  }));
}

// ---- capital de trabajo neto ----------------------------------------------
export function workingCapital(data) {
  const ac = block(data, "activo_corriente").total;
  const pc = block(data, "pasivo_corriente").total;
  return data.meta.years.map((year, i) => ({
    year,
    capitalTrabajo: z(ac[i]) - z(pc[i]),
    ac: ac[i],
    pc: pc[i],
  }));
}

// ---- estructura patrimonial (pasivo vs patrimonio) ------------------------
export function financingStructure(data) {
  const pas = data.esf.totales.pasivo;
  const pat = data.esf.totales.patrimonio;
  return data.meta.years.map((year, i) => {
    const total = z(pas[i]) + z(pat[i]);
    return {
      year,
      pasivo: pas[i],
      patrimonio: pat[i],
      total,
      pasivoPct: total ? pas[i] / total : 0,
      patrimonioPct: total ? pat[i] / total : 0,
    };
  });
}

// ---- DuPont ---------------------------------------------------------------
export function dupontSeries(data) {
  const m = ratioItem(data, "dp_margen");
  const r = ratioItem(data, "dp_rotacion");
  const l = ratioItem(data, "dp_multiplicador");
  const roe = ratioItem(data, "roe_dupont") || ratioItem(data, "roe");
  return data.meta.years.map((year, i) => ({
    year,
    margen: m?.values[i] ?? null,
    rotacion: r?.values[i] ?? null,
    multiplicador: l?.values[i] ?? null,
    roe: roe?.values[i] ?? null,
  }));
}

// ---- ciclo de conversión de efectivo --------------------------------------
export function cashCycle(data) {
  const dio = ratioItem(data, "dio");
  const dso = ratioItem(data, "dso");
  const dpo = ratioItem(data, "dpo");
  const cce = ratioItem(data, "cce");
  return data.meta.years.map((year, i) => ({
    year,
    dio: dio?.values[i] ?? null,
    dso: dso?.values[i] ?? null,
    dpo: dpo?.values[i] != null ? -dpo.values[i] : null, // se dibuja hacia abajo
    dpoRaw: dpo?.values[i] ?? null,
    cce: cce?.values[i] ?? null,
  }));
}

// ---- segmentos del balance (5 bloques) para el radial ----------------------
// El total = Activo + (Pasivo+Patrimonio) = 2×Activo, así que la mitad del
// anillo son activos y la otra mitad el financiamiento.
export function balanceSegments(data, i) {
  const bloques = data.esf.bloques;
  const segs = bloques.map((b) => ({
    id: b.id,
    label: b.label,
    lado: b.lado,
    value: Math.max(0, b.total?.[i] ?? 0),
  }));
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  const activo = data.esf.totales.activo[i] || 1;
  const financiamiento = (data.esf.totales.pasivo[i] || 0) + (data.esf.totales.patrimonio[i] || 0) || 1;
  return segs.map((s) => ({
    ...s,
    pctTotal: s.value / total,
    pctLado: s.value / (s.lado === "activo" ? activo : financiamiento),
    ladoTotal: s.lado === "activo" ? activo : financiamiento,
  }));
}

// ---- serie simple año→valor para el ER lineal ------------------------------
export function erSeriesRows(data, ids) {
  return data.meta.years.map((year, i) => {
    const row = { year };
    ids.forEach((id) => {
      const l = erLine(data, id);
      row[id] = l ? l.values[i] : null;
    });
    return row;
  });
}
