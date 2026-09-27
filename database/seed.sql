-- ==============================================================================
-- FarmaApp - Seed Data (25 Productos Farmacéuticos Reales)
-- Categorías: Analgésicos, Antibióticos, Antihistamínicos, Primeros Auxilios, Cuidado Personal
-- Moneda: Soles Peruanos (PEN - S/)
-- ==============================================================================

DO $$
DECLARE
    cat_analgesicos_id UUID;
    cat_antibioticos_id UUID;
    cat_antihistaminicos_id UUID;
    cat_primeros_auxilios_id UUID;
    cat_cuidado_personal_id UUID;
BEGIN
    -- 1. Inserción de Categorías
    INSERT INTO public.categorias (nombre, descripcion)
    VALUES 
        ('Analgésicos', 'Medicamentos para el alivio del dolor y reducción de fiebre o inflamación.')
    ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
    RETURNING id INTO cat_analgesicos_id;

    INSERT INTO public.categorias (nombre, descripcion)
    VALUES 
        ('Antibióticos', 'Fármacos antibacterianos y antimicrobianos bajo prescripción médica.')
    ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
    RETURNING id INTO cat_antibioticos_id;

    INSERT INTO public.categorias (nombre, descripcion)
    VALUES 
        ('Antihistamínicos', 'Tratamiento de alergias respiratorias, cutáneas y síntomas de rinitis.')
    ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
    RETURNING id INTO cat_antihistaminicos_id;

    INSERT INTO public.categorias (nombre, descripcion)
    VALUES 
        ('Primeros Auxilios', 'Materiales de curación, desinfección y atención médica inmediata.')
    ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
    RETURNING id INTO cat_primeros_auxilios_id;

    INSERT INTO public.categorias (nombre, descripcion)
    VALUES 
        ('Cuidado Personal', 'Higiene, protección dérmica, cuidado bucal e instrumental básico.')
    ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
    RETURNING id INTO cat_cuidado_personal_id;

    -- 2. Inserción de Productos (BOT-000001 a BOT-000025)

    -- CATEGORÍA 1: ANALGÉSICOS (BOT-000001 a BOT-000005)
    INSERT INTO public.productos (categoria_id, codigo_barras, nombre, descripcion, precio, stock, stock_minimo, imagen_url, activo)
    VALUES 
    (
        cat_analgesicos_id,
        'BOT-000001',
        'Paracetamol 500 mg (Caja x 100 tabletas)',
        'Analgésico y antipirético eficaz contra el dolor leve a moderado y control térmico.',
        15.50,
        60,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000001.jpg',
        true
    ),
    (
        cat_analgesicos_id,
        'BOT-000002',
        'Ibuprofeno 400 mg (Caja x 20 tabletas)',
        'Antiinflamatorio no esteroideo (AINE) con acción analgésica y antipirética rápida.',
        12.00,
        45,
        8,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000002.jpg',
        true
    ),
    (
        cat_analgesicos_id,
        'BOT-000003',
        'Naproxeno Sódico 550 mg (Caja x 10 tabletas)',
        'Alivio prolongado del dolor muscular, articular, dental y cefaleas intensas.',
        18.00,
        35,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000003.jpg',
        true
    ),
    (
        cat_analgesicos_id,
        'BOT-000004',
        'Panadol Antigripal NF (Caja x 24 tabletas)',
        'Fórmula multisíntoma para malestar general, congestión nasal, dolor y fiebre.',
        22.50,
        50,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000004.jpg',
        true
    ),
    (
        cat_analgesicos_id,
        'BOT-000005',
        'Clonixinato de Lisina 125 mg (Dorixina x 10 comp)',
        'Analgésico de acción potente para dolores espasmódicos, traumatismos y post-operatorios.',
        28.00,
        30,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000005.jpg',
        true
    ),

    -- CATEGORÍA 2: ANTIBIÓTICOS (BOT-000006 a BOT-000010)
    (
        cat_antibioticos_id,
        'BOT-000006',
        'Amoxicilina 500 mg (Caja x 50 cápsulas)',
        'Antibiótico betalactámico de amplio espectro para infecciones respiratorias y dentales.',
        32.00,
        40,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000006.jpg',
        true
    ),
    (
        cat_antibioticos_id,
        'BOT-000007',
        'Azitromicina 500 mg (Caja x 3 tabletas)',
        'Macrólido de dosis diaria para infecciones del tracto respiratorio y piel.',
        25.00,
        45,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000007.jpg',
        true
    ),
    (
        cat_antibioticos_id,
        'BOT-000008',
        'Ciprofloxacino 500 mg (Caja x 10 tabletas)',
        'Fluoroquinolona para infecciones bacterianas gastrointestinales y urinarias.',
        20.00,
        30,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000008.jpg',
        true
    ),
    (
        cat_antibioticos_id,
        'BOT-000009',
        'Cefalexina 500 mg (Caja x 20 cápsulas)',
        'Cefalosporina de primera generación indicada para infecciones dérmicas y respiratorias.',
        24.50,
        25,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000009.jpg',
        true
    ),
    (
        cat_antibioticos_id,
        'BOT-000010',
        'Claritromicina 500 mg (Caja x 10 tabletas)',
        'Antibiótico macrólido efectivo en faringitis, amigdalitis y erradicación de H. pylori.',
        38.00,
        20,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000010.jpg',
        true
    ),

    -- CATEGORÍA 3: ANTIHISTAMÍNICOS (BOT-000011 a BOT-000015)
    (
        cat_antihistaminicos_id,
        'BOT-000011',
        'Cetirizina 10 mg (Caja x 10 tabletas)',
        'Antialérgico no sedante de segunda generación para rinitis y urticaria crónica.',
        10.00,
        70,
        15,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000011.jpg',
        true
    ),
    (
        cat_antihistaminicos_id,
        'BOT-000012',
        'Loratadina 10 mg (Caja x 10 tabletas)',
        'Alivio rápido de estornudos, secreción nasal y picazón ocular o cutánea.',
        9.50,
        65,
        15,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000012.jpg',
        true
    ),
    (
        cat_antihistaminicos_id,
        'BOT-000013',
        'Clorfenamina Maleato 4 mg (Caja x 100 tab)',
        'Antihistamínico clásico para cuadros alérgicos agudos y prurito intenso.',
        12.00,
        80,
        20,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000013.jpg',
        true
    ),
    (
        cat_antihistaminicos_id,
        'BOT-000014',
        'Levocetirizina 5 mg (Caja x 10 tabletas recubiertas)',
        'Enantiómero activo con alta selectividad y mínimas reacciones adversas.',
        26.00,
        40,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000014.jpg',
        true
    ),
    (
        cat_antihistaminicos_id,
        'BOT-000015',
        'Desloratadina 5 mg (Caja x 10 tabletas)',
        'Control continuo 24 horas para síntomas alérgicos estacionales y persistentes.',
        34.00,
        35,
        8,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000015.jpg',
        true
    ),

    -- CATEGORÍA 4: PRIMEROS AUXILIOS (BOT-000016 a BOT-000020)
    (
        cat_primeros_auxilios_id,
        'BOT-000016',
        'Alcohol Etílico 70° Rectificado (Frasco x 1000 ml)',
        'Antiséptico y desinfectante de grado médico para uso tópico y superficies.',
        8.50,
        50,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000016.jpg',
        true
    ),
    (
        cat_primeros_auxilios_id,
        'BOT-000017',
        'Agua Oxigenada 10 Volúmenes (Frasco x 250 ml)',
        'Solución antiséptica limpiadora y hemostática para pequeñas heridas superficiales.',
        4.50,
        40,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000017.jpg',
        true
    ),
    (
        cat_primeros_auxilios_id,
        'BOT-000018',
        'Algodón Hidrófilo Premium (Paquete x 100 g)',
        '100% puro algodón absorbente esterilizable para curaciones y limpieza cutánea.',
        5.00,
        55,
        15,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000018.jpg',
        true
    ),
    (
        cat_primeros_auxilios_id,
        'BOT-000019',
        'Gasas Fraccionadas Estériles 10x10 cm (Sobre x 5 un)',
        'Apósitos estériles de tejido suave no adherente para protección de lesiones.',
        6.50,
        100,
        25,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000019.jpg',
        true
    ),
    (
        cat_primeros_auxilios_id,
        'BOT-000020',
        'Venda Elástica Compresiva 4 pulgadas (Rollo x 5 yardas)',
        'Sujeción anatómica elástica para soporte articular, torceduras y vendajes.',
        7.00,
        40,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000020.jpg',
        true
    ),

    -- CATEGORÍA 5: CUIDADO PERSONAL (BOT-000021 a BOT-000025)
    (
        cat_cuidado_personal_id,
        'BOT-000021',
        'Bloqueador Solar Dermatológico SPF 50+ (Frasco x 120 ml)',
        'Fotoprotección de muy amplio espectro UVA/UVB resistente al agua y tacto seco.',
        45.00,
        25,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000021.jpg',
        true
    ),
    (
        cat_cuidado_personal_id,
        'BOT-000022',
        'Jabón Líquido Antibacterial Neutro (Dispensador x 400 ml)',
        'Limpieza e higiene profunda con glicerina humectante que respeta el pH de la piel.',
        14.00,
        30,
        8,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000022.jpg',
        true
    ),
    (
        cat_cuidado_personal_id,
        'BOT-000023',
        'Termómetro Digital Clínico Punta Flexible (Unidad)',
        'Lectura precisa en 10 segundos con alarma sonora de fiebre y memoria de última medición.',
        22.00,
        20,
        5,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000023.jpg',
        true
    ),
    (
        cat_cuidado_personal_id,
        'BOT-000024',
        'Gel Antibacterial Desinfectante 70% (Frasco x 500 ml)',
        'Fórmula sanitizante instantánea enriquecida con aloe vera para el cuidado de manos.',
        9.00,
        45,
        10,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000024.jpg',
        true
    ),
    (
        cat_cuidado_personal_id,
        'BOT-000025',
        'Cepillo Dental Ortodoncia Suave (Unidad en Blíster)',
        'Cerdas con corte en V especialmente diseñadas para brackets y encías sensibles.',
        8.00,
        60,
        15,
        'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/BOT-000025.jpg',
        true
    )
    ON CONFLICT (codigo_barras) DO UPDATE SET
        categoria_id = EXCLUDED.categoria_id,
        nombre = EXCLUDED.nombre,
        descripcion = EXCLUDED.descripcion,
        precio = EXCLUDED.precio,
        stock = EXCLUDED.stock,
        stock_minimo = EXCLUDED.stock_minimo,
        imagen_url = EXCLUDED.imagen_url,
        activo = EXCLUDED.activo;

END $$;
