# Fondos del modo presentación

Una imagen por año. Se muestra a pantalla completa detrás de la lámina de ese año,
desenfocada y con un velo encima para que el texto siga leyéndose.

**Nombre del archivo = el año, y nada más.** `2010.png`, `1956.png`, `2025.png`.
La app la busca sola; no hay que tocar código para cambiar una foto.

Los 21 archivos que están ahora son placeholders (un degradado del color de la
categoría con el año escrito). Reemplázalos por fotos reales.

## Cómo cambiar una foto

1. Consigue la imagen del año.
2. Guárdala aquí como `<año>.png` — el mismo nombre que el placeholder.
3. Recarga la página y entra a **▶ Presentación**.

Si borras un archivo, esa lámina simplemente sale sin fondo. No se rompe nada.

## Recomendaciones para las fotos

- **Formato:** PNG (o JPG renombrado a `.png` si pesa mucho menos; el navegador lo
  detecta por contenido, no por extensión).
- **Tamaño:** 1600×900 px o mayor, horizontal. Se recorta a pantalla completa
  (`background-size: cover`), así que lo importante debe estar hacia el centro.
- **Peso:** por debajo de ~300 KB. Solo se carga la del año que estás viendo.
- **Qué funciona mejor:** imágenes con una zona tranquila a la izquierda, que es donde
  va el texto. Fotos muy cargadas de detalle o con texto propio compiten con la lámina
  — como igual van desenfocadas, no se pierde nada.
- **Claras u oscuras:** da igual. El velo se adapta al tema (claro/oscuro) por sí solo.

## Dónde se ajusta la opacidad, el desenfoque y el velo

Todo está en un solo bloque, al **inicio** de `timeline/slides.css`, marcado con un
recuadro que dice `CONTROLES DEL FONDO POR AÑO`:

```css
.sl-overlay {
  --bg-opacity: 0.30;  /* cuánto se ve la foto. 0 = invisible · 1 = a tope */
  --bg-blur: 14px;     /* desenfoque. 0 = nítida · 30px = muy difusa */
  --bg-scrim: 0.72;    /* velo encima. 0 = sin velo · 1 = tapa la foto entera */
  --bg-zoom: 26s;      /* zoom lento de la foto. 0s la deja quieta */
}
```

Cambiar cualquiera de esos cuatro valores afecta a **todas** las láminas de golpe.

Justo debajo hay un segundo bloque solo para el tema oscuro, porque ahí la foto
necesita un poco más de cuerpo:

```css
:root[data-theme="dark"] .sl-overlay {
  --bg-opacity: 0.40;
  --bg-scrim: 0.64;
}
```

### Guía rápida

| Lo que quieres | Qué mover |
|---|---|
| Ver más la foto | sube `--bg-opacity` (p. ej. 0.45) **o** baja `--bg-scrim` (p. ej. 0.55) |
| El texto no se lee bien | baja `--bg-opacity` **o** sube `--bg-scrim` |
| Foto más nítida | baja `--bg-blur` (p. ej. 6px) |
| Foto más difusa | sube `--bg-blur` (p. ej. 22px) |
| Quitar el movimiento | `--bg-zoom: 0s` |
| Apagar los fondos del todo | `--bg-opacity: 0` |

## Ajustar un año en concreto

Si una foto puntual queda muy fuerte o muy tenue, puedes darle su propio valor sin
tocar el resto. Añade al final de `timeline/slides.css`:

```css
/* la foto de 2019 es muy clara: le bajo la opacidad solo a ella */
.sl-overlay:has(.sl-bg[style*="2019"]) {
  --bg-opacity: 0.18;
}
```
