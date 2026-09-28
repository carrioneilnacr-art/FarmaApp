const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando compilación de FarmaApp Release APK...');

// Ensure ANDROID_HOME is set
if (!process.env.ANDROID_HOME) {
  process.env.ANDROID_HOME = 'C:\\Users\\Leonardo\\AppData\\Local\\Android\\Sdk';
}

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';

try {
  console.log('📦 Ejecutando assembleRelease con Gradle...');
  execSync(`${gradlewCmd} assembleRelease --no-daemon`, {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env,
  });

  const outputApk = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release.apk'
  );

  if (fs.existsSync(outputApk)) {
    const destRelease = path.join(rootDir, 'FarmaApp-release.apk');
    const destStandard = path.join(rootDir, 'FarmaApp.apk');

    fs.copyFileSync(outputApk, destRelease);
    fs.copyFileSync(outputApk, destStandard);

    const stats = fs.statSync(outputApk);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

    console.log('\n=========================================');
    console.log('✅ ¡APK Release compilado exitosamente!');
    console.log(`📁 Ubicación: ${destStandard}`);
    console.log(`⚖️  Tamaño: ${sizeMb} MB (Optimizado con Hermes)`);
    console.log('📱 Listo para instalar en cualquier teléfono Android.');
    console.log('=========================================\n');
  } else {
    console.error('❌ Error: No se encontró el archivo app-release.apk generado.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error durante la compilación del APK:', error.message);
  process.exit(1);
}
