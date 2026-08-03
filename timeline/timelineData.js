// Hitos corporativos de Alicorp S.A.A. (1956–2025).
// Fuente: lámina "Evolución de Alicorp S.A.A." + memorias y EEFF separados auditados.
// Las cifras financieras (FIN_BY_YEAR) vienen de public/data/alicorp.json, en MILES de soles.
//
// Campos por hito:
//   title / text  → tarjeta del rail (versión corta)
//   detail        → viñetas del modo presentación (versión larga)
//   note          → lectura contable/financiera del año
//   images        → archivos en public/timeline/logos (ver README de esa carpeta)
//
// Para mover o redimensionar las imágenes de la presentación a mano,
// ver el bloque "AJUSTE MANUAL DE LAS IMÁGENES" justo encima de EVENTS.

export const LOGO_DIR = "timeline/logos/";

export const CATEGORIES = [
  { id: "fundacion", label: "Fundación", varName: "--series-6" },
  { id: "gobierno", label: "Gobierno corporativo", varName: "--series-2" },
  { id: "fusion", label: "Fusión", varName: "--series-5" },
  { id: "adquisicion", label: "Adquisición", varName: "--series-1" },
  { id: "expansion", label: "Expansión internacional", varName: "--series-3" },
  { id: "desinversion", label: "Desinversión", varName: "--series-7" },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
export const categoryColor = (id) => `var(${categoryById(id).varName})`;

export const ERAS = [
  {
    id: "origenes",
    label: "Orígenes y fusiones fundacionales",
    from: 1956,
    to: 1996,
    note: "De Anderson Clayton a CFP: el negocio se arma por absorciones en el Perú.",
  },
  {
    id: "identidad",
    label: "Identidad Alicorp e internacionalización",
    from: 1997,
    to: 2011,
    note: "Nace la marca Alicorp, se abre el accionariado y arranca la salida regional.",
  },
  {
    id: "expansion",
    label: "Expansión regional y adquisiciones",
    from: 2012,
    to: 2020,
    note: "Acuicultura, Bolivia, cuidado del hogar y compra de marcas de aceites.",
  },
  {
    id: "reenfoque",
    label: "Reenfoque de portafolio",
    from: 2021,
    to: 2025,
    note: "Salida de Argentina y Brasil, fusiones internas y nuevas compras selectivas.",
  },
];

export const eraOf = (year) =>
  ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];

/** Cifras del EEFF separado (miles de soles) para enriquecer los hitos desde 2010. */
export const FIN_BY_YEAR = {
  2010: { ingresos: 3221838, operativa: 449482, neta: 294059 },
  2011: { ingresos: 3687483, operativa: 452195, neta: 322510 },
  2012: { ingresos: 3681343, operativa: 416745, neta: 315613 },
  2013: { ingresos: 3838726, operativa: 421777, neta: 221324 },
  2014: { ingresos: 3926549, operativa: 141726, neta: 10421 },
  2015: { ingresos: 3913878, operativa: 290888, neta: 153588 },
  2016: { ingresos: 4040731, operativa: 413661, neta: 302491 },
  2017: { ingresos: 4230270, operativa: 479802, neta: 453095 },
  2018: { ingresos: 4354489, operativa: 507092, neta: 442881 },
  2019: { ingresos: 4687530, operativa: 550994, neta: 476228 },
  2020: { ingresos: 5273500, operativa: 401575, neta: 327393 },
  2021: { ingresos: 6478035, operativa: 260764, neta: -33990 },
  2022: { ingresos: 7319192, operativa: 344718, neta: 524143 },
  2023: { ingresos: 6685002, operativa: 523062, neta: 188369 },
  2024: { ingresos: 6370885, operativa: 813366, neta: 341940 },
  2025: { ingresos: 6407059, operativa: 671345, neta: 446334 },
};

/* ══════════════════════════════════════════════════════════════════
   AJUSTE MANUAL DE LAS IMÁGENES EN LA PRESENTACIÓN
   ══════════════════════════════════════════════════════════════════
   Por defecto las marcas se apilan una por fila y se reparten el alto
   disponible. Cuando un año no queda bien así, se corrige aquí mismo —
   no hace falta tocar el CSS. Todos los campos son opcionales.

   ── Por año (junto a `year`, `title`…) ──────────────────────────────
     imgHeight: 320   Alto del bloque de marcas, en píxeles.
                      Súbelo para que se vean más grandes, bájalo si
                      empujan las cifras hacia abajo.
     imgCols: 2       En cuántas columnas se reparten. 1 = apiladas.
                      Dos columnas encogen los logotipos apaisados,
                      así que conviene sobre todo con los cuadrados.

   ── Por imagen (dentro de `images`) ─────────────────────────────────
     scale: 1.25      Tamaño respecto al que le tocaría. 1 = sin tocar,
                      0.8 = 20% más chico, 1.25 = 25% más grande.
     x: -14           La mueve en horizontal, en píxeles. Negativo = izquierda.
     y: 8             La mueve en vertical, en píxeles. Negativo = arriba.

   Ejemplo — un año con dos marcas, la segunda algo más grande y subida:

     {
       year: 2012,
       …
       imgHeight: 340,
       images: [
         { src: "salmofood.png", label: "Salmofood" },
         { src: "vitapro.png", label: "Vitapro", scale: 1.2, y: -8 },
       ],
     }

   Ojo con `scale` por encima de 1: la imagen se sale de su casilla y
   puede pisar a la vecina. Es a propósito — el control es tuyo —, pero
   si dos se tocan, ese suele ser el motivo.
   ══════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   MARCA DE AGUA DE LA TARJETA "HITO DEL AÑO"
   ══════════════════════════════════════════════════════════════════
   En el dashboard, el hito lleva de fondo UNA marca del año — la
   primera de `images` — grande y ajustada a la tarjeta, por detrás del
   texto. Los años sin imagen simplemente no llevan fondo.

   El único mando es la opacidad. Es el equilibrio entre que se note la
   marca y que el texto siga leyéndose:
     0.05  apenas se intuye
     0.09  el punto de partida
     0.16  se ve claramente, y ya empieza a estorbar la lectura

   Si un año concreto pide otra cosa —un logo muy oscuro que tapa, o
   uno muy tenue que no se ve—, se pisa desde el propio hito:

     { year: 2019, …, markOpacity: 0.06 }

   Y si prefieres otra marca distinta a la primera de `images`:

     { year: 2019, …, markSrc: "sapolio.png" }
   ══════════════════════════════════════════════════════════════════ */

export const MARK_BG = { opacity: 0.09 };

/** Hitos en orden cronológico. */
export const EVENTS = [
  {
    year: 1956, imgHeight: 460,
    title: "Constitución como Anderson Clayton & Company",
    text: "Se constituye la compañía en el Callao, dedicada a la fabricación de aceites y jabones.",
    detail: [
      "Anderson Clayton & Company, de capitales estadounidenses, instala una planta de aceites y jabones en el Callao.",
      "El negocio nace ligado al procesamiento de semillas oleaginosas: aceite comestible y jabón de lavar.",
      "Es el origen societario directo de lo que hoy es Alicorp S.A.A.",
    ],
    category: "fundacion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Aceites", "Jabones"],
    images: [{ src: "anderson-clayton.png", label: "Anderson Clayton & Co." }],
  },
  {
    year: 1971,
    title: "Adquisición por el Grupo Romero — CIPPSA",
    text: "El Grupo Romero compra la empresa y la renombra Compañía Industrial Perú Pacífico S.A. (CIPPSA).",
    detail: [
      "El Grupo Romero adquiere la operación peruana de Anderson Clayton.",
      "La sociedad se renombra Compañía Industrial Perú Pacífico S.A. (CIPPSA).",
      "Primer cambio de control: la empresa pasa a capital peruano y entra al portafolio industrial del grupo.",
    ],
    category: "gobierno",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Grupo Romero", "CIPPSA"],
    images: [
      { src: "grupo-romero.png", label: "Grupo Romero" },
      { src: "cippsa.png", label: "CIPPSA" },
    ],
  },
  {
    year: 1993,
    title: "Fusión con Calixto Romero y Oleaginosas Pisco",
    text: "CIPPSA absorbe Calixto Romero S.A. y Oleaginosas Pisco S.A., consolidando el negocio de aceites.",
    detail: [
      "CIPPSA absorbe por fusión a Calixto Romero S.A. y a Oleaginosas Pisco S.A.",
      "Se concentra en una sola sociedad la capacidad de molienda y refinación de aceites del grupo.",
      "Queda instalada la estrategia de crecer absorbiendo empresas relacionadas.",
    ],
    category: "fusion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Calixto Romero", "Oleaginosas Pisco"],
    images: [
      { src: "calixto-romero.png", label: "Calixto Romero" },
      { src: "oleaginosas-pisco.png", label: "Oleaginosas Pisco" },
    ],
  },
  {
    year: 1995,
    title: "Cambio a CFP y absorción de las molineras",
    text: "Pasa a llamarse Consorcio de Alimentos Fabril Pacífico (CFP) y absorbe Nicolini Hermanos S.A. y Molinera del Perú S.A.",
    detail: [
      "La sociedad pasa a llamarse Consorcio de Alimentos Fabril Pacífico (CFP).",
      "Absorbe Nicolini Hermanos S.A. y Molinera del Perú S.A., dos molineras de trigo.",
      "Con harinas y pastas sumadas a los aceites, el portafolio se vuelve multicategoría.",
    ],
    category: "fusion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Nicolini Hermanos", "Molinera del Perú"],
    images: [
      { src: "cfp.png", label: "Consorcio Fabril Pacífico",y: -340,scale: 0.5 },
      { src: "nicolini.png", label: "Nicolini Hermanos",y: -190,scale: 0.5 },
      { src: "molinera-del-peru.png", label: "Molinera del Perú",y: -0,scale: 0.5 },
    ],
  },
  {
    year: 1997,
    title: "Nace Alicorp S.A.A.",
    text: "Cambio de razón social a Alicorp y adecuación a Sociedad Anónima Abierta, con más de 750 accionistas.",
    detail: [
      "Cambio de razón social a Alicorp, la marca corporativa que se usa hasta hoy.",
      "Se adecua a Sociedad Anónima Abierta al superar los 750 accionistas.",
      "Como S.A.A. queda obligada a reportar información financiera al mercado y a listar en bolsa.",
    ],
    category: "gobierno",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Alicorp", "S.A.A."],
    images: [{ src: "alicorp.png", label: "Alicorp S.A.A.",scale: 1.2 }],
    note: "Desde aquí el accionariado es abierto: la empresa queda sujeta a reporte ante la SMV.",
  },
  {
    year: 2004,
    title: "Adquisición de Alimentum S.A.",
    text: "Compra de Alimentum S.A. y de la marca de helados Lamborghini.",
    detail: [
      "Adquisición de Alimentum S.A. y de la marca de helados Lamborghini.",
      "Entrada a la categoría de helados, fuera del núcleo de aceites, harinas y pastas.",
      "Refuerza la estrategia de crecer comprando marcas ya posicionadas en el mercado.",
    ],
    category: "adquisicion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Alimentum", "Lamborghini"],
    images: [{ src: "lamborghini.png", label: "Helados Lamborghini",y: -120 }],
  },
  {
    year: 2005,
    title: "Inicio de operaciones internacionales",
    text: "Arranca la operación en Ecuador, Colombia, Brasil, Chile y Argentina.",
    detail: [
      "Inicio formal de operaciones fuera del Perú: Ecuador, Colombia, Brasil, Chile y Argentina.",
      "El modelo pasa de exportador a operador local, con sociedades propias en cada país.",
      "Es el punto de partida de la estructura de subsidiarias que hoy domina el balance separado.",
    ],
    category: "expansion",
    flags: ["🇪🇨", "🇨🇴", "🇧🇷", "🇨🇱", "🇦🇷"],
    countries: ["Ecuador", "Colombia", "Brasil", "Chile", "Argentina"],
    tags: ["Consumo masivo"],
    images: [{ src: "expansion-regional.png", label: "Expansión regional",y: -170 }],
  },
  {
    year: 2008,
    title: "Cuidado personal y entrada a Argentina",
    text: "Ingreso a Argentina con productos de cuidado personal, vía The Value Brands Company (Argentina, Perú, Uruguay) y Propersa (Colombia).",
    detail: [
      "Ingreso al negocio de cuidado personal en Argentina.",
      "Compra de The Value Brands Company, con operaciones en Argentina, Perú y Uruguay.",
      "Adquisición de Propersa en Colombia.",
      "Alicorp deja de ser solo alimentos: el cuidado personal entra al portafolio.",
    ],
    category: "expansion",
    flags: ["🇦🇷", "🇺🇾", "🇨🇴"],
    countries: ["Argentina", "Uruguay", "Colombia", "Perú"],
    tags: ["The Value Brands", "Propersa"],
    images: [
      { src: "the-value-brands.png", label: "The Value Brands Co.",y: -220 },
      { src: "propersa.png", label: "Propersa",y: -120 },
    ],
  },
  {
    year: 2010,
    title: "Asociaciones en Ecuador y Argentina",
    text: "Asociación con Heladosa (Ecuador) y Sanford (Argentina).",
    detail: [
      "Asociación con Heladosa en Ecuador.",
      "Asociación con Sanford en Argentina.",
      "Crecimiento vía alianzas en vez de compra total, para entrar más rápido a cada mercado.",
    ],
    category: "expansion",
    flags: ["🇪🇨", "🇦🇷"],
    countries: ["Ecuador", "Argentina"],
    tags: ["Heladosa", "Sanford"],
    images: [{ src: "heladosa.png", label: "Heladosa",y: -300,scale:0.6 }],
    note: "Base separada 2010: la matriz opera como holding y mide sus inversiones por método de costo.",
  },
  {
    year: 2011,
    title: "Salida de los helados y primer año con NIIF plenas",
    text: "Se venden los activos del negocio de helados, la Compañía adopta plenamente las NIIF y nace Alicorp Inversiones S.A.",
    detail: [
      "En setiembre de 2011 se venden los activos del negocio de helados, la categoría que había entrado con Lamborghini en 2004.",
      "Primeros estados financieros separados con NIIF plenas: la fecha de transición es el 1 de enero de 2010 y ese año se reexpresa para comparar.",
      "Se constituye Alicorp Inversiones S.A. (99.99%) con S/66,284 miles, un vehículo para agrupar las participaciones del grupo.",
      "En setiembre se refinancia deuda con un préstamo de US$70,000 miles del Bank of America y Citibank, con vencimientos entre 2015 y 2018.",
    ],
    category: "desinversion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Helados", "NIIF 1", "Alicorp Inversiones"],
    images: [{ src: "lamborghini.png", label: "Helados Lamborghini", y: -120 }],
    note: "Las inversiones en subsidiarias todavía se miden al costo — el cambio a método de participación recién llega en 2012, y es lo que rompe la comparabilidad del patrimonio. Las exportaciones fueron 14.1% de las ventas netas.",
  },
  {
    year: 2012,
    title: "Holdco España y Salmofood",
    text: "Creación de Alicorp Holdco España S.L. y adquisición de Salmofood (hoy Vitapro Chile) en nutrición animal. Se suma Okebón.",
    detail: [
      "Creación de Alicorp Holdco España S.L. como vehículo de inversiones del grupo.",
      "Adquisición de Salmofood en Chile: alimento para salmón, hoy bajo el paraguas de Vitapro.",
      "Nace la tercera pata del negocio: nutrición animal y acuicultura.",
      "Se suma Okebón al portafolio de consumo masivo.",
    ],
    category: "adquisicion",
    flags: ["🇪🇸", "🇨🇱"],
    countries: ["España", "Chile"],
    tags: ["Salmofood", "Vitapro", "Okebón"],
    images: [
      { src: "salmofood.png", label: "Salmofood",y: -300 },
      { src: "vitapro.png", label: "Vitapro",y: -200 },
      { src: "okebon.png", label: "Okebón",y: -290,scale:0.7 },
    ],
    note: "Las inversiones pasan de método de costo a participación: rompe la comparabilidad del patrimonio y del ROE frente a 2011.",
  },
  {
    year: 2013,
    title: "Compra de Santa Amália en Brasil",
    text: "Adquisición del Pastificio Santa Amália (Brasil) y de la marca Sayón.",
    detail: [
      "Compra del Pastificio Santa Amália, fabricante de pastas en Brasil.",
      "Se incorpora la marca Sayón.",
      "Brasil pasa a ser una operación productiva, no solo comercial.",
    ],
    category: "adquisicion",
    flags: ["🇧🇷", "🇵🇪"],
    countries: ["Brasil", "Perú"],
    tags: ["Santa Amália", "Sayón"],
    images: [
      { src: "santa-amalia.png", label: "Santa Amália",y: -300,scale:0.7 },
      { src: "sayon.png", label: "Sayón",y: -150,scale:0.5 },
    ],
  },
  {
    year: 2014,
    title: "Global Alimentos y Molino Saracolca",
    text: "Compra de Global Alimentos (cereales Ángel) y del Molino Saracolca.",
    detail: [
      "Compra de Global Alimentos, dueña de la marca de cereales Ángel.",
      "Adquisición del Molino Saracolca.",
      "Refuerzo en la categoría de desayunos y en capacidad propia de molienda.",
    ],
    category: "adquisicion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Global Alimentos", "Ángel", "Saracolca"],
    images: [{ src: "global-alimentos.png", label: "Global Alimentos",y: -250,scale:0.8 }],
    note: "Año de utilidad neta mínima del periodo por pérdidas en derivados de materias primas.",
  },
  {
    year: 2015,
    title: "Desapalancamiento y arranque de Masterbread",
    text: "Año de saneamiento: se recorta deuda, se cierran las posiciones en derivados que hundieron 2014 y Masterbread empieza a operar.",
    detail: [
      "Masterbread S.A. (75%, constituida con un tercero en 2014) inicia operaciones comerciales el 28 de marzo de 2015.",
      "La pérdida por derivados de materias primas cae de S/171,928 a S/8,631 miles y el fondo de garantía por derivados baja de S/220,655 a S/1,919 miles.",
      "La deuda financiera se reduce de S/2,076,929 a S/1,615,146 miles entre corriente y no corriente.",
      "Se aportan S/83,493 miles de capital a subsidiarias y se reciben S/83,364 miles en dividendos (Vitapro, Alicorp Ecuador y Alicorp Inversiones).",
      "La planta de fideos Alianza, en la Av. Argentina, pasa a activos mantenidos para la venta.",
    ],
    category: "desinversion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Masterbread", "Desapalancamiento", "Planta Alianza"],
    images: [{ src: "masterbread.png", label: "Masterbread", y: -180, scale: 0.8 }],
    note: "La utilidad neta se recupera a S/153,588 miles tras el mínimo de 2014, pero por control de derivados y gastos financieros, no por más ventas: los ingresos quedan planos frente al año anterior.",
  },
  {
    year: 2016,
    title: "Constitución de Vitapro Honduras",
    text: "Se constituye Vitapro Honduras S.A. de C.V. En el portafolio: Primor, Blanca Flor y Don Vittorio.",
    detail: [
      "Se constituye Vitapro Honduras S.A. de C.V.",
      "Vitapro extiende el negocio de acuicultura a Centroamérica.",
      "En consumo masivo se consolidan Primor, Blanca Flor y Don Vittorio como marcas ancla.",
    ],
    category: "expansion",
    flags: ["🇭🇳"],
    countries: ["Honduras"],
    tags: ["Vitapro Honduras", "Primor", "Blanca Flor", "Don Vittorio"],
    images: [
      { src: "vitapro-honduras.png", label: "Vitapro Honduras",y: -250,scale:0.5,x:-150 },
      { src: "primor.png", label: "Primor",y: -350,scale:0.5,x:+150 },
      { src: "blanca-flor.png", label: "Blanca Flor",y: -220,scale:0.5,x:+150 },
      { src: "don-vittorio.png", label: "Don Vittorio",y: -210,scale:0.5,x:+150 },
    ],
  },
  {
    year: 2017,
    title: "Utilidad récord y simplificación societaria",
    text: "La mejor utilidad neta separada hasta ese momento, con reordenamiento de subsidiarias y la evaluación de Bolivia ya en marcha.",
    detail: [
      "El 11 de setiembre de 2017 se aprueba la disolución y liquidación de Alicorp Guatemala S.A.",
      "El 13 de octubre de 2017 Consorcio Distribuidor Iquitos S.A. se transfiere a Alicorp Inversiones S.A.; en diciembre se capitalizan S/21,310 miles de deuda.",
      "El 17 de octubre de 2017 Cernical Group S.A. traslada su domicilio fiscal de Panamá al Perú.",
      "Las subsidiarias aportan S/154,356 miles por método de participación y reparten S/96,060 miles en dividendos (Vitapro, S/61,359 miles).",
    ],
    category: "gobierno",
    flags: ["🇵🇪", "🇬🇹", "🇵🇦"],
    countries: ["Perú", "Guatemala", "Panamá"],
    tags: ["Alicorp Guatemala", "Cernical Group", "Alicorp Inversiones"],
    images: [{ src: "alicorp.png", label: "Alicorp S.A.A.", scale: 1.1, y: -60 }],
    note: "De los S/453,095 miles de utilidad neta, S/154,356 miles vienen de las subsidiarias: un tercio del resultado no lo genera la operación propia. En enero de 2018 el Directorio aprueba evaluar la compra de Industrias del Aceite S.A. y ADM SAO S.A. — el paso previo a Bolivia.",
  },
  {
    year: 2018,
    title: "Expansión en Bolivia",
    text: "Adquisición de Industrias de Aceite S.A. (marca Fino) y de Sociedad Aceitera del Oriente S.R.L.",
    detail: [
      "Adquisición de Industrias de Aceite S.A. en Bolivia, dueña de la marca Fino.",
      "Compra de Sociedad Aceitera del Oriente S.R.L.",
      "Bolivia se vuelve plataforma de molienda de soya y aceites para el grupo.",
    ],
    category: "expansion",
    flags: ["🇧🇴"],
    countries: ["Bolivia"],
    tags: ["Industrias de Aceite", "Fino", "SAO"],
    images: [
      { src: "industrias-de-aceite.png", label: "Industrias de Aceite",y: -150,scale:1 },
      { src: "fino.png", label: "Fino",y: -320,scale:0.6 },
    ],
    note: "La NIIF 16 empieza a elevar los pasivos por arrendamientos: Deuda/Patrimonio no es comparable con años previos.",
  },
  {
    year: 2019,
    title: "Adquisición de Intradevco Industrial",
    text: "Compra de Intradevco Industrial S.A. (Sapolio), entrada de peso al cuidado del hogar.",
    detail: [
      "Adquisición de Intradevco Industrial S.A., dueña de la marca Sapolio.",
      "Entrada de peso al cuidado del hogar: limpieza, detergentes y cuidado personal.",
      "Es el año de mayor huella geográfica del grupo en el periodo analizado.",
    ],
    category: "adquisicion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Intradevco", "Sapolio"],
    images: [
      { src: "intradevco.png", label: "Intradevco Industrial",y: -320,scale:0.8 },
      { src: "sapolio.png", label: "Sapolio",y: -140,scale:0.8 },
    ],
    note: "Máxima huella geográfica del periodo y utilidad neta récord hasta ese momento.",
  },
  {
    year: 2020,
    title: "Marcas de aceites de ADM y fusiones internas",
    text: "Adquisición de las marcas de aceites de ADM (Sao, Ideal, Mirasol) y fusiones internas. En cartera, Bolívar y Opal.",
    detail: [
      "Compra de las marcas de aceites de ADM: Sao, Ideal y Mirasol.",
      "Fusiones internas para simplificar la estructura societaria del grupo.",
      "En cuidado del hogar se consolidan también Bolívar y Opal.",
    ],
    category: "adquisicion",
    flags: ["🇧🇴", "🇵🇪"],
    countries: ["Bolivia", "Perú"],
    tags: ["ADM", "Sao", "Ideal", "Mirasol", "Bolívar", "Opal"],
    images: [
      { src: "sao.png", label: "SAO",y: -110,x:-10 },
      { src: "ideal.png", label: "Ideal",y: -110,scale:0.85,x:-150 },
      { src: "mirasol.png", label: "Mirasol" },
      { src: "bolivar.png", label: "Bolívar",y: -240,scale:1.2,x:+30 },
      { src: "opal.png", label: "Opal",y: -5,scale:1,x:+320 },
    ],
  },
  {
    year: 2021,
    title: "Venta de Argentina y de Santa Amália",
    text: "Venta de las operaciones en Argentina y del Pastificio Santa Amália (Brasil).",
    detail: [
      "Venta de las operaciones en Argentina (Alicorp Argentina S.C.A.), en diciembre de 2021.",
      "Venta del Pastificio Santa Amália en Brasil.",
      "Giro de estrategia: de expandir a concentrarse en los mercados más rentables.",
    ],
    category: "desinversion",
    flags: ["🇦🇷", "🇧🇷"],
    countries: ["Argentina", "Brasil"],
    tags: ["Alicorp Argentina", "Santa Amália"],
    images: [
      { src: "alicorp-argentina.png", label: "Alicorp Argentina",y: -310,scale:0.5 },
      { src: "santa-amalia.png", label: "Santa Amália",y: -250,scale:0.5 },
    ],
    note: "Única pérdida neta del periodo, por participación negativa en subsidiarias.",
  },
  {
    year: 2022,
    title: "Fusión corporativa con Vegetalia",
    text: "Fusión corporativa con Vegetalia S.A.C.",
    detail: [
      "Fusión corporativa con Vegetalia S.A.C.",
      "Continúa la simplificación de la estructura de sociedades del grupo.",
    ],
    category: "fusion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Vegetalia"],
    images: [{ src: "vegetalia.png", label: "Vegetalia",y:-100 }],
  },
  {
    year: 2023,
    title: "Inversiones Piuranas llega al 68.271%",
    text: "Inversiones Piuranas S.A. incrementa su participación en el accionariado hasta 68.271%.",
    detail: [
      "Inversiones Piuranas S.A. sube su participación en el accionariado a 68.271%.",
      "El control del accionista mayoritario se concentra todavía más.",
      "La sociedad sigue siendo abierta, pero con un controlador claramente definido.",
    ],
    category: "gobierno",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Inversiones Piuranas"],
    images: [{ src: "inversiones-piuranas.png", label: "Inversiones Piuranas" }],
    note: "La utilidad neta separada cae por el efecto de operaciones discontinuadas.",
  },
  {
    year: 2024,
    title: "Reducciones de capital y Refinería del Espino",
    text: "Reducciones de capital y adquisición de Refinería del Espino S.A.",
    detail: [
      "Reducciones de capital aprobadas por la junta de accionistas.",
      "Adquisición de Refinería del Espino S.A., ligada a la palma aceitera.",
      "Integración hacia atrás en la cadena de aceites.",
    ],
    category: "adquisicion",
    flags: ["🇵🇪"],
    countries: ["Perú"],
    tags: ["Refinería del Espino"],
    images: [{ src: "refineria-del-espino.png", label: "Refinería del Espino",y:-250 }],
    note: "El capital emitido baja de 847,192 a 686,226 (miles S/): eleva artificialmente el ROE y el apalancamiento.",
  },
  {
    year: 2025,
    title: "Jabonería Wilson, Disanu y Sanuss",
    text: "Compra de Jabonería Wilson, Disanu y Sanuss, más nuevas compras de acciones.",
    detail: [
      "Compra de Jabonería Wilson.",
      "Adquisiciones de Disanu y Sanuss.",
      "Nuevas compras de acciones para consolidar participaciones en subsidiarias.",
    ],
    category: "adquisicion",
    flags: ["🇪🇨", "🇵🇪"],
    countries: ["Ecuador", "Perú"],
    tags: ["Jabonería Wilson", "Disanu", "Sanuss"],
    images: [
      { src: "jaboneria-wilson.png", label: "Jabonería Wilson",y:-340,scale:0.7 },
      { src: "disanu.png", label: "Disanu",y:-120,scale:0.7 },
      { src: "sanuss.png", label: "Sanuss",y:-320,scale:0.7 },
    ],
    note: "Nueva reducción de capital a 569,573 (miles S/) y utilidad operativa alta del periodo reciente.",
  },
];

/** Países distintos tocados por la línea de tiempo. */
export const ALL_COUNTRIES = [...new Set(EVENTS.flatMap((e) => e.countries ?? []))];
