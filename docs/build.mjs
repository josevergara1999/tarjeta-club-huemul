// Empaqueta el canvas de Claude Design en UN solo HTML autocontenido.
// No toca el diseño: solo mete dentro del archivo lo que el navegador
// pediría por red (runtime, marco de iPhone, imágenes).
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

const P   = process.env.P
const SC  = process.env.SC
const src = readFileSync(P + '/Tarjeta Club Huemul.dc.html', 'utf8')

// 1. El cuerpo del documento tal cual, sin el envoltorio html/head/body
//    (el publicador pone el suyo).
const i = src.indexOf('<body>') + '<body>'.length
const j = src.lastIndexOf('</body>')
let doc = src.slice(i, j).trim()

// 2. assets/*.png -> data: URI. Sustitución literal, misma cadena que ya
//    está escrita en el diseño (tanto en src="" como en la lógica JS).
const IMGS = {
  'assets/emblem-alpha.png': ['emblem-alpha.png', 'image/png'],
  'assets/qr-real.png':      ['qr-real.png',      'image/png'],
  'assets/stamp-c6.png':     ['stamp-c6.png',     'image/png'],
  'assets/new-0823.png':     ['new-0823.jpg',     'image/jpeg'],
  'assets/new-0845.png':     ['new-0845.jpg',     'image/jpeg'],
  'assets/new-0859.png':     ['new-0859.jpg',     'image/jpeg'],
  'assets/new-0913.png':     ['new-0913.jpg',     'image/jpeg'],
  'assets/new-0925.png':     ['new-0925.jpg',     'image/jpeg'],
}
for (const [ref, [file, mime]] of Object.entries(IMGS)) {
  const b64 = readFileSync(SC + '/img/' + file).toString('base64')
  const uri = 'data:' + mime + ';base64,' + b64
  const antes = doc.split(ref).length - 1
  if (!antes) throw new Error('no aparece ' + ref)
  doc = doc.split(ref).join(uri)
  console.log('  ' + ref.padEnd(26) + antes + ' usos  ' + Math.round(b64.length / 1024) + ' KB')
}
// Los sellos se arman por concatenacion ('assets/stamp-c' + n + '.png'), asi que
// no hay cadena literal que sustituir: se apunta la MISMA expresion a la tabla.
doc = doc.split("'assets/stamp-c' + ((j % 5) + 1) + '.png'")
         .join("__IMG['stamp-c' + ((j % 5) + 1) + '.png']")
doc = doc.split(`'url("assets/stamp-c' + ((j % 5) + 1) + '.png")'`)
         .join(`'url(\"' + __IMG['stamp-c' + ((j % 5) + 1) + '.png'] + '\")'`)
if (/assets\//.test(doc)) throw new Error('quedaron referencias a assets/')

const tabla = {}
for (const n of [1, 2, 3, 4, 5]) {
  const f = 'stamp-c' + n + '.png'
  tabla[f] = 'data:image/png;base64,' + readFileSync(SC + '/img/' + f).toString('base64')
  console.log('  ' + ('assets/' + f).padEnd(26) + 'tabla  ' + Math.round(tabla[f].length / 1024) + ' KB')
}

// 3. El runtime del diseño espera React, ReactDOM y Babel en window, y busca
//    los archivos importados en __resourceBlobs antes de salir a la red.
const lib  = n => readFileSync(SC + '/lib/' + n, 'utf8')
const jsx  = readFileSync(P + '/ios-frame.jsx', 'utf8')
const supp = readFileSync(P + '/support.js', 'utf8')

// En un telefono, el marco de iPhone del prototipo se dibuja DENTRO del telefono:
// un mockup, no la app. Ahi el marco sobra — y la barra de estado falsa queda
// debajo de la de verdad, doblada. Asi que en pantallas chicas el marco se suelta
// del contenedor y ocupa todo, y se esconden isla, barra de estado e indicador.
// Solo afecta a la presentacion: el diseno de project/ no cambia.
const CSS_MOVIL = `
@media (max-width: 820px) {
  html, body { overflow: hidden; }
  /* Las franjas fuera del area segura toman el fondo del lienzo, que sale del
     <html>. Se le pone el mismo degradado del diseno para que no se note el corte. */
  html { background: linear-gradient(180deg, #d9d1c5 0%, #cbc2b6 55%, #bcb1a2 100%); }
  [data-om-starter="ios-frame"] {
    position: fixed !important; inset: 0 !important;
    width: auto !important; height: auto !important;
    border-radius: 0 !important; box-shadow: none !important;
  }
  [data-om-starter="ios-frame"] > div:nth-child(1),
  [data-om-starter="ios-frame"] > div:nth-child(2),
  [data-om-starter="ios-frame"] > div:nth-child(4) { display: none !important; }
}`

const cabeza = [
  // Primero de todo: sin esto el navegador lee el UTF-8 como latin-1 y los
  // acentos salen rotos ("FIDELIZACION" con basura). El prescan solo mira los
  // primeros 1024 bytes, asi que va antes que cualquier libreria.
  '<meta charset="utf-8">',
  // Tan imprescindible como el charset, y por el mismo motivo: venia en el <head>
  // original. Sin ella Safari maqueta a 980px de ancho y luego encoge la pagina,
  // asi que la regla de movil de abajo no llega a aplicarse nunca.
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Tarjeta Club Huemul</title>',
  // Instalada en el telefono, iOS pinta las franjas del notch y del indicador de
  // home con el color de fondo del documento. Sin declararlo salian BLANCAS,
  // cortando el crema del diseno por arriba y por abajo.
  '<meta name="theme-color" content="#d9d1c5">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="Club Huemul">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
  '<script>' + lib('react.js') + '</script>',
  '<script>' + lib('react-dom.js') + '</script>',
  '<script>' + lib('babel.js') + '</script>',
  '<script>window.__IMG=' + JSON.stringify(tabla) + ';</script>',
  '<script>window.__resources={};window.__resourceBlobs={"./ios-frame.jsx":new Blob([' +
    JSON.stringify(jsx) + '],{type:"text/jsx"})};</script>',
  '<script>' + supp + '</script>',
  '<style>' + CSS_MOVIL + '</style>',
].join('\n')

const out = SC + '/index.html'
writeFileSync(out, cabeza + '\n' + doc + '\n')
console.log('\n' + basename(out) + '  ' + Math.round(readFileSync(out).length / 1024) + ' KB')
