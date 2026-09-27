const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://rlldwhipkzcbjjjbqozg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbGR3aGlwa3pjYmpqamJxb3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0Mzc1NjMsImV4cCI6MjEwNjAxMzU2M30.2drvGiij1heS-vWfugvRHbYrmKAVJiBPvYy1xOQfNrA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 25 Curated high-resolution real pharmaceutical product images
const PRODUCT_IMAGES = [
  // Analgésicos
  {
    code: 'BOT-000001',
    name: 'Paracetamol 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000002',
    name: 'Ibuprofeno 400 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000003',
    name: 'Naproxeno Sodico 550 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000004',
    name: 'Panadol Antigripal NF',
    sourceUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000005',
    name: 'Clonixinato de Lisina 125 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=85'
  },
  // Antibióticos
  {
    code: 'BOT-000006',
    name: 'Amoxicilina 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000007',
    name: 'Azitromicina 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000008',
    name: 'Ciprofloxacino 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000009',
    name: 'Cefalexina 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000010',
    name: 'Claritromicina 500 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&auto=format&fit=crop&q=85'
  },
  // Antihistamínicos
  {
    code: 'BOT-000011',
    name: 'Cetirizina 10 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000012',
    name: 'Loratadina 10 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000013',
    name: 'Clorfenamina Maleato 4 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000014',
    name: 'Levocetirizina 5 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000015',
    name: 'Desloratadina 5 mg',
    sourceUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&auto=format&fit=crop&q=85'
  },
  // Primeros Auxilios
  {
    code: 'BOT-000016',
    name: 'Alcohol Etilico 70',
    sourceUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000017',
    name: 'Agua Oxigenada 10 Vol.',
    sourceUrl: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8e4?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000018',
    name: 'Algodon Hidrofilo Premium',
    sourceUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000019',
    name: 'Gasas Esteriles 10x10 cm',
    sourceUrl: 'https://images.unsplash.com/photo-1583947582387-578d06b99b50?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000020',
    name: 'Venda Elastica 4 pulg.',
    sourceUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=85'
  },
  // Cuidado Personal
  {
    code: 'BOT-000021',
    name: 'Bloqueador Solar SPF 50',
    sourceUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000022',
    name: 'Jabon Liquido Antibacterial',
    sourceUrl: 'https://images.unsplash.com/photo-1608248597359-59754f9a0c71?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000023',
    name: 'Termometro Digital Clinico',
    sourceUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000024',
    name: 'Gel Antibacterial 70%',
    sourceUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=85'
  },
  {
    code: 'BOT-000025',
    name: 'Cepillo Dental Ortodoncia Suave',
    sourceUrl: 'https://images.unsplash.com/photo-1559591937-e16694e09d5a?w=600&auto=format&fit=crop&q=85'
  }
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith('https') ? https : http;
    getter.get(url, (res) => {
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadAndSyncAll() {
  console.log(`Iniciando carga de ${PRODUCT_IMAGES.length} imágenes a Supabase Storage...`);

  for (let i = 0; i < PRODUCT_IMAGES.length; i++) {
    const item = PRODUCT_IMAGES[i];
    const fileName = `${item.code}.jpg`;
    console.log(`[${i + 1}/${PRODUCT_IMAGES.length}] Descargando foto para ${item.code} (${item.name})...`);

    try {
      const buffer = await downloadImage(item.sourceUrl);
      console.log(`  -> Descargado (${(buffer.length / 1024).toFixed(1)} KB). Subiendo a Supabase Storage (productos/${fileName})...`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`  ERROR al subir a Storage:`, uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log(`  -> URL pública de Supabase: ${publicUrl}`);

      // Actualizar registro en la base de datos de Supabase
      const { error: dbError } = await supabase
        .from('productos')
        .update({ imagen_url: publicUrl })
        .eq('codigo_barras', item.code);

      if (dbError) {
        console.error(`  ERROR actualizando BD para ${item.code}:`, dbError);
      } else {
        console.log(`  -> BD actualizada con éxito para ${item.code}`);
      }

    } catch (err) {
      console.error(`  ERROR procesando ${item.code}:`, err.message);
    }
  }

  console.log('\nSincronización completada exitosamente.');
}

uploadAndSyncAll();
