# Logos e imágenes de la línea de tiempo

Todos los archivos de esta carpeta son **PNG placeholder** generados automáticamente:
monograma de la marca y su nombre, sin caja ni fondo. Están pensados para reemplazarse
por el logo o la foto real.

Formato actual: **PNG de 600×300 px, fondo transparente.**

> La app **no dibuja ningún recuadro ni fondo detrás del logo** — la imagen se apoya
> directo sobre la tarjeta o la lámina. Por eso el PNG debe venir con transparencia:
> un logo con fondo blanco se verá como un parche recortado, sobre todo en tema oscuro.

## Cómo reemplazar una imagen

1. Consigue el logo/foto real. Guárdalo en **PNG** con fondo transparente.
2. Ponlo en esta carpeta **con el mismo nombre de archivo** que el placeholder.
   - Ej.: reemplaza `grupo-romero.png` por el logo real del Grupo Romero.
3. Recarga la página. No hace falta tocar código.

Si subes un archivo con otro nombre o con otra extensión (`.jpg`, `.webp`), actualiza
la ruta en `timeline/timelineData.js` → campo `images` del hito correspondiente.

## Recomendaciones

- **Formato:** PNG con transparencia, obligatorio. No lleva caja de contención.
- **Proporción:** horizontal, cercana a 2:1 (los placeholders son 600×300).
- **Recorte:** sin márgenes muertos alrededor del logo — el espacio vacío del PNG lo
  hace verse más chico de lo que debería.
- **Tamaño:** ancho ≥ 480 px para que se vea nítido en el modo presentación.
- **Peso:** por debajo de ~150 KB por imagen.

Si un archivo falta o no carga, la app dibuja sola un monograma con las iniciales de la
marca — no se rompe la pantalla.

## Qué imagen va con qué hito

La asignación está en `timeline/timelineData.js`, en el campo `images` de cada hito:

```js
{
  year: 1971,
  title: "Adquisición por el Grupo Romero — CIPPSA",
  images: [
    { src: "grupo-romero.png", label: "Grupo Romero" },
    { src: "cippsa.png", label: "CIPPSA" },
  ],
}
```

Para agregar una imagen nueva, súbela aquí y añade una entrada `{ src, label }` al hito
que corresponda.

## Inventario (46 archivos)

| Año  | Archivos |
|------|----------|
| 1956 | `anderson-clayton.png` |
| 1971 | `grupo-romero.png`, `cippsa.png` |
| 1993 | `calixto-romero.png`, `oleaginosas-pisco.png` |
| 1995 | `cfp.png`, `nicolini.png`, `molinera-del-peru.png` |
| 1997 | `alicorp.png` |
| 2004 | `alimentum.png`, `lamborghini.png` |
| 2005 | `expansion-regional.png` |
| 2008 | `the-value-brands.png`, `propersa.png` |
| 2010 | `heladosa.png`, `sanford.png` |
| 2012 | `salmofood.png`, `vitapro.png`, `holdco-espana.png`, `okebon.png` |
| 2013 | `santa-amalia.png`, `sayon.png` |
| 2014 | `global-alimentos.png`, `angel.png`, `molino-saracolca.png` |
| 2016 | `vitapro-honduras.png`, `primor.png`, `blanca-flor.png`, `don-vittorio.png` |
| 2018 | `industrias-de-aceite.png`, `fino.png` |
| 2019 | `intradevco.png`, `sapolio.png` |
| 2020 | `adm.png`, `sao.png`, `ideal.png`, `mirasol.png`, `bolivar.png`, `opal.png` |
| 2021 | `alicorp-argentina.png`, `santa-amalia.png` (reusa el de 2013) |
| 2022 | `vegetalia.png` |
| 2023 | `inversiones-piuranas.png` |
| 2024 | `refineria-del-espino.png` |
| 2025 | `jaboneria-wilson.png`, `disanu.png`, `sanuss.png` |
