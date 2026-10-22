BEGIN;
DO $$
DECLARE v_count integer;
BEGIN
    IF (SELECT count(*) FROM public.productos WHERE codigo_barras IN ('BOT-000001', 'BOT-000002', 'BOT-000003', 'BOT-000004', 'BOT-000005', 'BOT-000006', 'BOT-000007', 'BOT-000008', 'BOT-000009', 'BOT-000010', 'BOT-000011', 'BOT-000012', 'BOT-000013', 'BOT-000014', 'BOT-000015', 'BOT-000016', 'BOT-000017', 'BOT-000018', 'BOT-000019', 'BOT-000020', 'BOT-000021', 'BOT-000022', 'BOT-000023', 'BOT-000024', 'BOT-000025')) <> 25 THEN
        RAISE EXCEPTION 'Expected all 25 catalog products; no changes applied';
    END IF;
    UPDATE public.productos AS p SET imagen_url = images.url
    FROM (VALUES
    ('BOT-000001', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000001-c7055e285709.jpg'),
    ('BOT-000002', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000002-d529027e0e91.jpg'),
    ('BOT-000003', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000003-315b119ffc97.jpg'),
    ('BOT-000004', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000004-0c285b3a4c8a.jpg'),
    ('BOT-000005', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000005-58ce120f77c0.jpg'),
    ('BOT-000006', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000006-1ffd40009039.jpg'),
    ('BOT-000007', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000007-cdc37ab563f7.jpg'),
    ('BOT-000008', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000008-a2608aa752cd.jpg'),
    ('BOT-000009', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000009-31547296fcd3.jpg'),
    ('BOT-000010', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000010-133222192800.jpg'),
    ('BOT-000011', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000011-080b841c366d.jpg'),
    ('BOT-000012', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000012-64214f328212.jpg'),
    ('BOT-000013', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000013-bd78965ccbc9.jpg'),
    ('BOT-000014', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000014-28b5c252e103.jpg'),
    ('BOT-000015', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000015-5be4f8def833.jpg'),
    ('BOT-000016', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000016-0c25a94edc45.jpg'),
    ('BOT-000017', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000017-7a9c08999b94.jpg'),
    ('BOT-000018', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000018-02715390f375.jpg'),
    ('BOT-000019', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000019-629bd89b3cd2.jpg'),
    ('BOT-000020', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000020-ba2e5da6a249.jpg'),
    ('BOT-000021', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000021-efa79eaded3a.jpg'),
    ('BOT-000022', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000022-8f1dc56941d6.jpg'),
    ('BOT-000023', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000023-dd06f8599583.jpg'),
    ('BOT-000024', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000024-8898ea352c83.jpg'),
    ('BOT-000025', 'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/catalog-v2/BOT-000025-80bb70a30e9b.jpg')
    ) AS images(code, url)
    WHERE p.codigo_barras = images.code AND p.imagen_url IS DISTINCT FROM images.url;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % catalog image URLs', v_count;
END $$;
COMMIT;
