const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML_SIMULATOR_PATH = path.join('C:', 'Users', 'Leonardo', '.gemini', 'antigravity', 'brain', '4433aaf8-f04c-4c39-94f2-aa731d95ce9a', 'farmapp_mobile_interactive_preview.html');
const BARCODES_DIR = path.join(__dirname, '..', 'test-assets', 'barcodes');
const ZXING_PATH = path.join(__dirname, '..', 'node_modules', '@zxing', 'library', 'umd', 'index.min.js');

const PRODUCTS = [
  {code:'BOT-000001', name:'Paracetamol 500 mg (Caja x 100)', cat:'Analgésicos', price:'S/ 15.50'},
  {code:'BOT-000002', name:'Ibuprofeno 400 mg (Caja x 20)', cat:'Analgésicos', price:'S/ 12.00'},
  {code:'BOT-000003', name:'Naproxeno Sódico 550 mg (Caja x 10)', cat:'Analgésicos', price:'S/ 18.00'},
  {code:'BOT-000004', name:'Panadol Antigripal NF (Caja x 24)', cat:'Analgésicos', price:'S/ 22.50'},
  {code:'BOT-000005', name:'Clonixinato de Lisina 125 mg (x 10)', cat:'Analgésicos', price:'S/ 28.00'},
  {code:'BOT-000006', name:'Amoxicilina 500 mg (Caja x 50)', cat:'Antibióticos', price:'S/ 32.00'},
  {code:'BOT-000007', name:'Azitromicina 500 mg (Caja x 3)', cat:'Antibióticos', price:'S/ 25.00'},
  {code:'BOT-000008', name:'Ciprofloxacino 500 mg (Caja x 10)', cat:'Antibióticos', price:'S/ 20.00'},
  {code:'BOT-000009', name:'Cefalexina 500 mg (Caja x 20)', cat:'Antibióticos', price:'S/ 24.50'},
  {code:'BOT-000010', name:'Claritromicina 500 mg (Caja x 10)', cat:'Antibióticos', price:'S/ 38.00'},
  {code:'BOT-000011', name:'Cetirizina 10 mg (Caja x 10)', cat:'Antihistamínicos', price:'S/ 10.00'},
  {code:'BOT-000012', name:'Loratadina 10 mg (Caja x 10)', cat:'Antihistamínicos', price:'S/ 9.50'},
  {code:'BOT-000013', name:'Clorfenamina Maleato 4 mg (x 100)', cat:'Antihistamínicos', price:'S/ 12.00'},
  {code:'BOT-000014', name:'Levocetirizina 5 mg (Caja x 10)', cat:'Antihistamínicos', price:'S/ 26.00'},
  {code:'BOT-000015', name:'Desloratadina 5 mg (Caja x 10)', cat:'Antihistamínicos', price:'S/ 34.00'},
  {code:'BOT-000016', name:'Alcohol Etílico 70° (Frasco x 1000 ml)', cat:'Primeros Auxilios', price:'S/ 8.50'},
  {code:'BOT-000017', name:'Agua Oxigenada 10 Vol. (Frasco x 250 ml)', cat:'Primeros Auxilios', price:'S/ 4.50'},
  {code:'BOT-000018', name:'Algodón Hidrófilo Premium (x 100 g)', cat:'Primeros Auxilios', price:'S/ 5.00'},
  {code:'BOT-000019', name:'Gasas Estériles 10x10 cm (Sobre x 5)', cat:'Primeros Auxilios', price:'S/ 6.50'},
  {code:'BOT-000020', name:'Venda Elástica 4 pulg. (Rollo x 5 yd)', cat:'Primeros Auxilios', price:'S/ 7.00'},
  {code:'BOT-000021', name:'Bloqueador Solar SPF 50 (x 120 ml)', cat:'Cuidado Personal', price:'S/ 45.00'},
  {code:'BOT-000022', name:'Jabón Líquido Antibacterial (x 400 ml)', cat:'Cuidado Personal', price:'S/ 14.00'},
  {code:'BOT-000023', name:'Termómetro Digital Clínico (Unidad)', cat:'Cuidado Personal', price:'S/ 22.00'},
  {code:'BOT-000024', name:'Gel Antibacterial 70% (x 500 ml)', cat:'Cuidado Personal', price:'S/ 9.00'},
  {code:'BOT-000025', name:'Cepillo Dental Ortodoncia (Unidad)', cat:'Cuidado Personal', price:'S/ 8.00'}
];

function generateBarcodeGalleryHtml() {
  const cards = PRODUCTS.map((p, idx) => `
    <div class="product-card bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center space-y-3" data-idx="${idx}">
      <div class="w-full flex items-center justify-between text-[11px] text-zinc-500 font-medium">
        <span class="bg-zinc-100 px-2 py-0.5 rounded font-mono font-bold text-zinc-800">${p.code}</span>
        <span>${p.cat}</span>
        <span class="font-bold text-zinc-900">${p.price}</span>
      </div>
      <div class="font-bold text-sm text-zinc-900 leading-snug px-2">${p.name}</div>
      
      <!-- Big barcode image on bright white background -->
      <div class="bg-white border-2 border-zinc-300 rounded-xl p-3 w-full flex items-center justify-center shadow-inner">
        <img src="/barcodes/${p.code}.png" alt="${p.code}" class="max-h-28 max-w-full object-contain filter contrast-125" style="image-rendering: pixelated;">
      </div>

      <div class="text-[11px] text-zinc-400 font-mono">Acerca este código a la webcam de tu PC</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FarmaApp — Códigos de Barra para Escanear</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-zinc-100 text-zinc-900 p-4 min-h-screen flex flex-col items-center">
  <div class="max-w-md w-full space-y-4">
    <div class="text-center pt-2">
      <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Prueba de Escáner</div>
      <h1 class="text-xl font-extrabold text-zinc-900">Códigos de Barra de Prueba</h1>
      <p class="text-xs text-zinc-600 mt-1">
        Muestra cualquiera de estos códigos en la pantalla de tu celular frente a la cámara web de tu PC para que los detecte y registre la venta.
      </p>
    </div>

    <!-- Quick index selector -->
    <div class="bg-white border border-zinc-200 rounded-xl p-3 flex gap-1.5 overflow-x-auto shadow-sm">
      ${PRODUCTS.map((p, i) => `
        <button onclick="scrollToCard(${i})" class="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-zinc-100 hover:bg-zinc-900 hover:text-white transition">
          ${p.code.replace('BOT-0000', '#')}
        </button>
      `).join('')}
    </div>

    <!-- Cards container -->
    <div class="space-y-4" id="cards-container">
      ${cards}
    </div>

    <div class="text-center text-xs text-zinc-400 pb-8">
      FarmaApp · 25 Medicamentos en Supabase
    </div>
  </div>

  <script>
    function scrollToCard(idx) {
      const cards = document.querySelectorAll('.product-card');
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Route: /zxing.min.js
  if (url === '/zxing.min.js') {
    if (fs.existsSync(ZXING_PATH)) {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(ZXING_PATH).pipe(res);
      return;
    }
  }

  // Route: /barcodes or /codigos
  if (url === '/barcodes' || url === '/codigos') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateBarcodeGalleryHtml());
    return;
  }

  // Route: /barcodes/BOT-XXXXXX.png
  if (url.startsWith('/barcodes/')) {
    const filename = path.basename(url);
    const filePath = path.join(BARCODES_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Route: Default simulator
  if (fs.existsSync(HTML_SIMULATOR_PATH)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(HTML_SIMULATOR_PATH).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Preview file not found');
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FarmaApp Server running at:`);
  console.log(`- Simulator: http://localhost:${PORT}`);
  console.log(`- Mobile Barcodes: http://192.168.18.4:${PORT}/barcodes`);
});
