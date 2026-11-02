// Configure le projet Android généré par Capacitor : permissions, signature, icônes, version.
const fs = require('fs');
const path = require('path');

const APP = path.join('android', 'app');
const MAIN = path.join(APP, 'src', 'main');
const KS_FILE = 'pose-co-release.p12';
const KS_PASS = 'VwIpwVqbB7r5Zs093Flpkf';
const KS_ALIAS = 'poseco';

function must(cond, msg) { if (!cond) { console.error('ERREUR : ' + msg); process.exit(1); } }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s); }

// 1) Permissions (caméra, GPS) -------------------------------------------------
const manifestPath = path.join(MAIN, 'AndroidManifest.xml');
let manifest = read(manifestPath);
if (!manifest.includes('android.permission.CAMERA')) {
  const marker = '<uses-permission android:name="android.permission.INTERNET" />';
  must(manifest.includes(marker), 'permission INTERNET introuvable dans AndroidManifest.xml');
  manifest = manifest.replace(marker, marker + [
    '',
    '    <uses-permission android:name="android.permission.CAMERA" />',
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '    <uses-feature android:name="android.hardware.camera" android:required="false" />',
    '    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
    '    <uses-feature android:name="android.hardware.location.gps" android:required="false" />'
  ].join('\n'));
  write(manifestPath, manifest);
}

// 2) Signature + version ------------------------------------------------------
fs.copyFileSync(path.join('signing', KS_FILE), path.join(APP, KS_FILE));
const gradlePath = path.join(APP, 'build.gradle');
let gradle = read(gradlePath);
if (!gradle.includes('signingConfigs')) {
  must(gradle.includes('    buildTypes {\n        release {'), 'bloc buildTypes/release introuvable dans build.gradle');
  gradle = gradle.replace('    buildTypes {\n        release {',
    '    signingConfigs {\n' +
    '        release {\n' +
    '            storeFile file("' + KS_FILE + '")\n' +
    '            storePassword "' + KS_PASS + '"\n' +
    '            keyAlias "' + KS_ALIAS + '"\n' +
    '            keyPassword "' + KS_PASS + '"\n' +
    '            storeType "pkcs12"\n' +
    '        }\n' +
    '    }\n' +
    '    buildTypes {\n        release {\n            signingConfig signingConfigs.release');
  const pkg = JSON.parse(read('package.json'));
  const code = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;
  must(/versionCode 1\n/.test(gradle) && /versionName "1.0"/.test(gradle), 'versionCode/versionName introuvables');
  gradle = gradle.replace(/versionCode 1\n/, 'versionCode ' + code + '\n').replace(/versionName "1.0"/, 'versionName "' + pkg.version + '"');
  write(gradlePath, gradle);
}

// 3) Icônes, écrans de démarrage, couleur de fond ------------------------------
function copyDir(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); }
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join('resources', 'android'), path.join(MAIN, 'res'));
write(path.join(MAIN, 'res', 'values', 'ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B6BCB</color>\n</resources>\n');

// 4) Impression native (fenêtre d'impression d'Android) ------------------------
const javaDir = path.join(MAIN, 'java', 'dz', 'poseco', 'terrain');
must(fs.existsSync(javaDir), 'dossier Java introuvable : ' + javaDir);
fs.copyFileSync(path.join('resources', 'java', 'PoseCoPrintPlugin.java'), path.join(javaDir, 'PoseCoPrintPlugin.java'));
fs.copyFileSync(path.join('resources', 'java', 'MainActivity.java'), path.join(javaDir, 'MainActivity.java'));

console.log('Projet Android configuré (permissions, signature, icônes, version).');
