// node scripts/upload-product-images.js --prepare | --upload | --verify
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const dir = path.join(__dirname, '..', 'assets', 'product-images');
const manifest = require('../assets/product-images/manifest.json');
const mode = process.argv[2];
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + url);
  if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Not an image: ' + url);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > 12 * 1024 * 1024) throw new Error('Image exceeds 12 MB');
  return data;
}
async function main() {
  if (!['--prepare', '--upload', '--verify'].includes(mode)) throw new Error('Choose --prepare, --upload or --verify');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (mode !== '--prepare' && (!url || !key)) throw new Error('Supabase configuration missing');
  const client = mode === '--upload' ? createClient(url, key, { auth: { persistSession: false } }) : null;
  const failures = [], report = [];
  for (const item of manifest.products) {
    try {
      const local = path.join(dir, item.code + '.jpg');
      if (mode === '--prepare') {
        if (fs.existsSync(local)) { console.log('Already prepared ' + item.code); continue; }
        const sharp = require('sharp');
        const data = await sharp(await download(item.sourceUrl)).rotate().resize(700, 700, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).jpeg({ quality: 86 }).toBuffer();
        fs.writeFileSync(local, data);
        console.log('Prepared ' + item.code + ': ' + data.length + ' bytes');
        continue;
      }
      const data = fs.readFileSync(local);
      const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);
      const storagePath = 'catalog-v2/' + item.code + '-' + hash + '.jpg';
      const publicUrl = url + '/storage/v1/object/public/productos/' + storagePath;
      if (mode === '--upload') {
        // Versioned filenames preserve old images and avoid stale Android caches.
        const { error } = await client.storage.from('productos').upload(storagePath, data, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
        if (error && String(error.statusCode) !== '409' && error.message !== 'The resource already exists') throw error;
      }
      const remote = await download(publicUrl);
      if (crypto.createHash('sha256').update(remote).digest('hex') !== crypto.createHash('sha256').update(data).digest('hex')) throw new Error('Remote image differs');
      report.push({ code: item.code, imagen_url: publicUrl, bytes: data.length });
      console.log('Verified ' + item.code + ': ' + data.length + ' bytes');
    } catch (error) { failures.push(item.code); console.error(item.code + ': ' + error.message); }
  }
  if (mode !== '--prepare') fs.writeFileSync(path.join(dir, 'upload-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (failures.length) throw new Error('Failed: ' + failures.join(', '));
  console.log('Completed ' + manifest.products.length + ' images (' + mode + ').');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
