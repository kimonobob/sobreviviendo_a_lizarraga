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
// Sigue los subtotales del estado de resultados separado: ventas netas →
// utilidad bruta → operativa → antes de impuesto → neta.
//
// Es un resumen del estado, no su copia: se dejan fuera el desglose de ventas
// (terceros / relacionadas) y la utilidad de operaciones continuas, que no
// abren ni cierran ningún tramo del puente. Lo que sí va suelto es todo lo que
// mueve el resultado de forma material — los dos bloques de gastos por
// separado, el impuesto y las operaciones discontinuadas, que en años como
// 2024 se llevan casi 200 millones ellas solas.
const ANCHORS = new Set([
  "ingresos",
  "utilidad_bruta",
  "utilidad_operativa",
  "utilidad_antes_impuesto",
  "utilidad_neta",
]);

// Cada tramo lleva dos nombres: `label` es el corto, para el eje del gráfico,
// donde solo entran unos 22 caracteres; `full` es el del estado auditado, y es
// el que sale en el tooltip y en el panel de cifras — las dos superficies donde
// uno va a cotejar el importe contra el EEFF y necesita el nombre exacto.
export function waterfall(data, i) {
  const v = (id) => z(erVals(data, id)[i]);
  const steps = [
    { id: "ingresos", label: "Ventas netas", value: v("ingresos") },
    { id: "costo_ventas", label: "Costo de ventas", value: v("costo_ventas") },
    { id: "utilidad_bruta", label: "Utilidad bruta", value: v("utilidad_bruta") },
    {
      id: "gastos_venta",
      label: "Gastos de ventas",
      full: "Gastos de ventas y distribución",
      value: v("gastos_venta"),
    },
    {
      id: "gastos_admin",
      label: "Gastos admin.",
      full: "Gastos administrativos",
      value: v("gastos_admin"),
    },
    {
      // Otros ingresos y gastos ya viene neto en la fuente; se le suma el
      // resultado de derivados de materias primas, que en casi todos los años
      // es marginal y no merece un tramo propio (2014 es la excepción).
      id: "otros_op",
      label: "Otros, neto",
      full: "Otros ingresos y gastos, neto + derivados de materias primas",
      value: v("derivados_mp") + v("otros_ingresos_gastos"),
    },
    { id: "utilidad_operativa", label: "Utilidad operativa", value: v("utilidad_operativa") },
    {
      id: "financiero",
      label: "Rdo. financiero",
      full: "Ingresos y gastos financieros + diferencia de cambio",
      value:
        v("ingresos_financieros") +
        v("gastos_financieros") +
        v("diferencia_cambio") +
        v("perdida_derivados"),
    },
    {
      id: "part_subsidiarias",
      label: "Part. en result. netos",
      full: "Participación en los resultados netos de subsidiarias y asociadas",
      value: v("part_subsidiarias"),
    },
    {
      id: "utilidad_antes_impuesto",
      label: "Ut. antes de imp.",
      full: "Utilidad antes del impuesto a las ganancias",
      value: v("utilidad_antes_impuesto"),
    },
    {
      id: "impuesto",
      label: "Impuesto",
      full: "Impuesto a las ganancias",
      value: v("impuesto"),
    },
    {
      id: "discontinuadas",
      label: "Discontinuadas",
      full: "Utilidad (pérdida) de operaciones discontinuadas, neta",
      value: v("discontinuadas"),
    },
    { id: "utilidad_neta", label: "Utilidad neta", value: v("utilidad_neta") },
  ];

  return bridge(steps, ANCHORS);
}

// Convierte una lista de tramos en un puente dibujable: las anclas arrancan en
// cero y fijan el acumulado; los demás flotan sobre el acumulado que traían.
function bridge(steps, anchors) {
  let cumul = 0;
  return steps.map((s) => {
    if (anchors.has(s.id)) {
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

// ---- composición de la utilidad neta, versión corta ------------------------
// El mismo recorrido que la cascada pero en cuatro subtotales, para leer de un
// vistazo cómo las ventas acaban en utilidad neta.
//
// El tramo "financieros, subsidiarias e impuesto" no estaba en la estructura
// pedida, pero sin él el puente no cierra: entre la utilidad operativa y la
// neta se pierden —o ganan— entre 27 y 320 millones según el año, y en 2022
// son +206,938. Sin ese tramo el gráfico mostraría un salto sin explicar.
const NI_ANCHORS = new Set([
  "ingresos",
  "utilidad_bruta",
  "utilidad_operativa",
  "utilidad_neta",
]);

export function netIncomeBridge(data, i) {
  const v = (id) => z(erVals(data, id)[i]);
  const steps = [
    { id: "ingresos", label: "Ventas netas", value: v("ingresos") },
    { id: "costo_ventas", label: "Costo de ventas", value: v("costo_ventas") },
    { id: "utilidad_bruta", label: "Utilidad bruta", value: v("utilidad_bruta") },
    {
      id: "gastos_op",
      label: "Gastos y otros",
      full: "Gastos, resultados y otros ingresos",
      value:
        v("gastos_venta") +
        v("gastos_admin") +
        v("derivados_mp") +
        v("otros_ingresos_gastos"),
    },
    { id: "utilidad_operativa", label: "Utilidad operativa", value: v("utilidad_operativa") },
    {
      id: "fsi",
      label: "Financ., subsid. e imp.",
      full: "Resultado financiero + participación en subsidiarias + impuesto",
      value:
        v("ingresos_financieros") +
        v("gastos_financieros") +
        v("diferencia_cambio") +
        v("perdida_derivados") +
        v("part_subsidiarias") +
        v("impuesto"),
    },
    {
      id: "discontinuadas",
      label: "Discontinuadas",
      full: "Utilidad (pérdida) de operaciones discontinuadas, neta",
      value: v("discontinuadas"),
    },
    { id: "utilidad_neta", label: "Utilidad neta", value: v("utilidad_neta") },
  ];
  return bridge(steps, NI_ANCHORS);
}

/**
 * La misma composición, año a año: los tres bloques que van de la utilidad
 * operativa a la neta. Suman exactamente la utilidad neta, así que la pila
 * cierra sin residuo y los tramos negativos caen bajo el eje.
 */
export function netIncomeSeries(data) {
  return data.meta.years.map((year, i) => {
    const v = (id) => z(erVals(data, id)[i]);
    const operativa = v("utilidad_operativa");
    const fsi =
      v("ingresos_financieros") +
      v("gastos_financieros") +
      v("diferencia_cambio") +
      v("perdida_derivados") +
      v("part_subsidiarias") +
      v("impuesto");
    const discontinuadas = v("discontinuadas");
    return {
      year,
      operativa,
      fsi,
      discontinuadas,
      bruta: v("utilidad_bruta"),
      ingresos: v("ingresos"),
      neta: operativa + fsi + discontinuadas,
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
