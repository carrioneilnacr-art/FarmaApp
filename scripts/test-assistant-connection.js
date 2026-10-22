// Manual smoke test. Credentials are passed only through process environment.
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
const base = env.EXPO_PUBLIC_SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const id = process.env.FARMAAPP_TEST_ID;
const password = process.env.FARMAAPP_TEST_PASSWORD;
if (!base || !anon || !id || !password) throw new Error('Faltan configuración o credenciales de prueba');

(async () => {
  const auth = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${id}@farmaapp.invalid`, password }),
  });
  const authBody = await auth.json();
  if (!auth.ok) throw new Error(`Inicio de sesión falló (${auth.status}): ${authBody.error_description || authBody.msg || 'error'}`);
  console.log(`Login ${id}: OK; rol: ${authBody.user?.app_metadata?.farmaapp_role}`);
  const reply = await fetch(`${base}/functions/v1/asistente-operativo`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${authBody.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'stock', question: '¿Qué productos requieren reposición?' }),
  });
  const replyBody = await reply.json();
  console.log(`Asistente ${id}: HTTP ${reply.status}`);
  if (!reply.ok) throw new Error(replyBody.error || 'Fallo de asistente');
  console.log(`Respuesta: ${replyBody.answer}`);
  const sales = await fetch(`${base}/functions/v1/asistente-operativo`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${authBody.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'ventas', question: '¿Cómo van las ventas de hoy?' }),
  });
  const expected = id === 'administrador' ? 200 : 403;
  console.log(`Permiso de ventas ${id}: HTTP ${sales.status} (esperado ${expected})`);
  if (sales.status !== expected) throw new Error('Control de rol incorrecto');
  const summary = await fetch(`${base}/rest/v1/rpc/obtener_resumen_diario`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${authBody.access_token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  console.log(`Resumen POS ${id}: HTTP ${summary.status}`);
  if (!summary.ok) throw new Error('El resumen de ventas de la app no funciona');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
