/**
 * FarmaApp - Generador de Códigos de Barra Code 128 en formato PNG
 * Genera imágenes PNG limpias y de alta resolución para pruebas con escáner móvil.
 * Cero dependencias externas (utiliza zlib nativo de Node.js).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Patrones Code 128 (0 a 106)
// Representan el ancho de barras y espacios alternados (B S B S B S)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 es STOP)
];

const START_B = 104;
const STOP = 106;

/**
 * Codifica una cadena de texto en módulos binarios (1s y 0s) usando Code 128B
 */
function encodeCode128B(text) {
  const codes = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const value = charCode - 32; // Code 128B mapea ASCII 32..127 a 0..95
    if (value < 0 || value > 95) {
      throw new Error(`Carácter no soportado en Code 128B: ${text[i]}`);
    }
    codes.push(value);
    checkSum += value * (i + 1);
  }

  const checkDigit = checkSum % 103;
  codes.push(checkDigit);
  codes.push(STOP);

  let bitString = '';
  for (let c of codes) {
    const pattern = CODE128_PATTERNS[c];
    let isBar = true;
    for (let char of pattern) {
      const count = parseInt(char, 10);
      bitString += (isBar ? '1' : '0').repeat(count);
      isBar = !isBar;
    }
  }

  return bitString;
}

// Matriz de caracteres 5x7 simplificada para renderizar el texto legible bajo el código de barra
const FONT_5X7 = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '-': [0, 0, 0, 0x1f, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  'A': [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  'B': [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  'C': [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  'D': [0x1c, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1c],
  'E': [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  'F': [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  'G': [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  'H': [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  'I': [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  'M': [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  'O': [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  'P': [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  'Q': [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  'R': [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  'S': [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  'T': [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  'X': [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  'Y': [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  'Z': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f]
};

/**
 * Crea un buffer PNG válido (RGBA)
 */
function createPNG(width, height, pixelBuffer) {
  // Encabezado PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method: Deflate
  ihdr[11] = 0; // Filter method: 0
  ihdr[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per row
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = rowOffset + 1 + x * 4;
      rawData[dstOffset] = pixelBuffer[srcOffset]; // R
      rawData[dstOffset + 1] = pixelBuffer[srcOffset + 1]; // G
      rawData[dstOffset + 2] = pixelBuffer[srcOffset + 2]; // B
      rawData[dstOffset + 3] = pixelBuffer[srcOffset + 3]; // A
    }
  }

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Crea un chunk PNG con su CRC32
 */
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCRC32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * Calcula el CRC32 para chunks de PNG
 */
function calculateCRC32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const CRC_TABLE = (function () {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

/**
 * Renderiza el código de barras y texto en una imagen RGBA
 */
function renderBarcodePNG(code, label, subtitle) {
  const bitString = encodeCode128B(code);
  const moduleWidth = 4; // Escala de píxeles por barra
  const barHeight = 120; // Altura de las barras
  const quietZone = 40; // Margen lateral
  const topMargin = 30; // Margen superior
  const bottomMargin = 70; // Margen inferior para textos

  const barcodePixelWidth = bitString.length * moduleWidth;
  const width = barcodePixelWidth + quietZone * 2;
  const height = topMargin + barHeight + bottomMargin;

  // Buffer RGBA (R, G, B, A) inicializado en Blanco (255, 255, 255, 255)
  const pixelBuffer = Buffer.alloc(width * height * 4, 255);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = (y * width + x) * 4;
    pixelBuffer[offset] = r;
    pixelBuffer[offset + 1] = g;
    pixelBuffer[offset + 2] = b;
    pixelBuffer[offset + 3] = a;
  }

  // 1. Dibujar barras
  for (let i = 0; i < bitString.length; i++) {
    if (bitString[i] === '1') {
      const startX = quietZone + i * moduleWidth;
      for (let mx = 0; mx < moduleWidth; mx++) {
        for (let y = topMargin; y < topMargin + barHeight; y++) {
          setPixel(startX + mx, y, 0, 0, 0); // Barra negra
        }
      }
    }
  }

  // 2. Dibujar texto del código (ej. "BOT-000001") centrado
  const scale = 3;
  const charWidth = 5 * scale;
  const charSpacing = 2 * scale;
  const totalTextWidth = code.length * charWidth + (code.length - 1) * charSpacing;
  const textStartX = Math.round((width - totalTextWidth) / 2);
  const textStartY = topMargin + barHeight + 15;

  for (let i = 0; i < code.length; i++) {
    const char = code[i].toUpperCase();
    const glyph = FONT_5X7[char] || FONT_5X7[' '];
    const charPosX = textStartX + i * (charWidth + charSpacing);

    for (let row = 0; row < 7; row++) {
      const rowBits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if ((rowBits >> (4 - col)) & 1) {
          for (let sx = 0; sx < scale; sx++) {
            for (let sy = 0; sy < scale; sy++) {
              setPixel(charPosX + col * scale + sx, textStartY + row * scale + sy, 30, 41, 59); // Slate dark
            }
          }
        }
      }
    }
  }

  return createPNG(width, height, pixelBuffer);
}

// ==============================================================================
// CATÁLOGO DE 25 PRODUCTOS (Alineado exactamente con database/seed.sql)
// ==============================================================================
const PRODUCTS = [
  { code: 'BOT-000001', name: 'Paracetamol 500 mg (Caja x 100 tabletas)', category: 'Analgésicos', price: 15.50, stock: 60 },
  { code: 'BOT-000002', name: 'Ibuprofeno 400 mg (Caja x 20 tabletas)', category: 'Analgésicos', price: 12.00, stock: 45 },
  { code: 'BOT-000003', name: 'Naproxeno Sódico 550 mg (Caja x 10 tabletas)', category: 'Analgésicos', price: 18.00, stock: 35 },
  { code: 'BOT-000004', name: 'Panadol Antigripal NF (Caja x 24 tabletas)', category: 'Analgésicos', price: 22.50, stock: 50 },
  { code: 'BOT-000005', name: 'Clonixinato de Lisina 125 mg (Dorixina x 10 comp)', category: 'Analgésicos', price: 28.00, stock: 30 },
  { code: 'BOT-000006', name: 'Amoxicilina 500 mg (Caja x 50 cápsulas)', category: 'Antibióticos', price: 32.00, stock: 40 },
  { code: 'BOT-000007', name: 'Azitromicina 500 mg (Caja x 3 tabletas)', category: 'Antibióticos', price: 25.00, stock: 45 },
  { code: 'BOT-000008', name: 'Ciprofloxacino 500 mg (Caja x 10 tabletas)', category: 'Antibióticos', price: 20.00, stock: 30 },
  { code: 'BOT-000009', name: 'Cefalexina 500 mg (Caja x 20 cápsulas)', category: 'Antibióticos', price: 24.50, stock: 25 },
  { code: 'BOT-000010', name: 'Claritromicina 500 mg (Caja x 10 tabletas)', category: 'Antibióticos', price: 38.00, stock: 20 },
  { code: 'BOT-000011', name: 'Cetirizina 10 mg (Caja x 10 tabletas)', category: 'Antihistamínicos', price: 10.00, stock: 70 },
  { code: 'BOT-000012', name: 'Loratadina 10 mg (Caja x 10 tabletas)', category: 'Antihistamínicos', price: 9.50, stock: 65 },
  { code: 'BOT-000013', name: 'Clorfenamina Maleato 4 mg (Caja x 100 tab)', category: 'Antihistamínicos', price: 12.00, stock: 80 },
  { code: 'BOT-000014', name: 'Levocetirizina 5 mg (Caja x 10 tabletas recubiertas)', category: 'Antihistamínicos', price: 26.00, stock: 40 },
  { code: 'BOT-000015', name: 'Desloratadina 5 mg (Caja x 10 tabletas)', category: 'Antihistamínicos', price: 34.00, stock: 35 },
  { code: 'BOT-000016', name: 'Alcohol Etílico 70° Rectificado (Frasco x 1000 ml)', category: 'Primeros Auxilios', price: 8.50, stock: 50 },
  { code: 'BOT-000017', name: 'Agua Oxigenada 10 Volúmenes (Frasco x 250 ml)', category: 'Primeros Auxilios', price: 4.50, stock: 40 },
  { code: 'BOT-000018', name: 'Algodón Hidrófilo Premium (Paquete x 100 g)', category: 'Primeros Auxilios', price: 5.00, stock: 55 },
  { code: 'BOT-000019', name: 'Gasas Fraccionadas Estériles 10x10 cm (Sobre x 5 un)', category: 'Primeros Auxilios', price: 6.50, stock: 100 },
  { code: 'BOT-000020', name: 'Venda Elástica Compresiva 4 pulgadas (Rollo x 5 yardas)', category: 'Primeros Auxilios', price: 7.00, stock: 40 },
  { code: 'BOT-000021', name: 'Bloqueador Solar Dermatológico SPF 50+ (Frasco x 120 ml)', category: 'Cuidado Personal', price: 45.00, stock: 25 },
  { code: 'BOT-000022', name: 'Jabón Líquido Antibacterial Neutro (Dispensador x 400 ml)', category: 'Cuidado Personal', price: 14.00, stock: 30 },
  { code: 'BOT-000023', name: 'Termómetro Digital Clínico Punta Flexible (Unidad)', category: 'Cuidado Personal', price: 22.00, stock: 20 },
  { code: 'BOT-000024', name: 'Gel Antibacterial Desinfectante 70% (Frasco x 500 ml)', category: 'Cuidado Personal', price: 9.00, stock: 45 },
  { code: 'BOT-000025', name: 'Cepillo Dental Ortodoncia Suave (Unidad en Blíster)', category: 'Cuidado Personal', price: 8.00, stock: 60 }
];

function main() {
  const outputDir = path.resolve(__dirname, '..', 'test-assets', 'barcodes');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('📦 Generando códigos de barra Code 128 para FarmaApp...');
  console.log(`📁 Directorio destino: ${outputDir}\n`);

  for (const product of PRODUCTS) {
    const pngBuffer = renderBarcodePNG(product.code, product.name, `${product.category} - S/ ${product.price.toFixed(2)}`);
    const fileName = `${product.code}.png`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pngBuffer);
    console.log(` ✅ Generado: ${fileName} -> ${product.name}`);
  }

  console.log(`\n🎉 Se generaron exitosamente los 25 códigos de barras en ${outputDir}`);
}

main();
