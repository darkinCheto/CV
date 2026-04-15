# CV Studio

Aplicacion estatica separada en varios archivos para crear un Curriculum Vitae en HTML y exportarlo a PDF.

## Estructura

- `index.html`: formulario principal.
- `cv.html`: vista previa del CV y descarga a PDF.
- `css/stylesCV.css`: estilos compartidos.
- `js/form.js`: captura de datos y logica del formulario.
- `js/cv.js`: renderizado del CV y generacion del PDF.

## Uso

1. Abre `index.html` en el navegador o sirve la carpeta con un servidor local.
2. Completa los datos personales, experiencia, educacion y proyectos.
3. Pulsa `Generate PDF` para ir a la vista del CV.
4. En `cv.html`, pulsa `Descargar PDF` para exportarlo.

## Nota

Si el navegador bloquea recursos externos al abrir archivos locales, usa un servidor simple como `python -m http.server` desde la carpeta del proyecto.