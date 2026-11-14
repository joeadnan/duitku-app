/**
 * Config plugin untuk @nozbe/watermelondb (Expo SDK 58 / React Native 0.88).
 *
 * Kenapa bukan @morrowdigital/watermelondb-expo-plugin?
 * Plugin itu menyisipkan `import com.facebook.react.bridge.JSIModulePackage` dan
 * meng-override `getJSIModulePackage()`. API tersebut sudah dihapus dari React Native
 * (sejak Arsitektur Baru menjadi satu-satunya arsitektur), jadi build Android gagal.
 * Di WatermelonDB 0.28 adapter JSI Android cukup didaftarkan sebagai ReactPackage biasa.
 *
 * Yang dilakukan plugin ini:
 *  Android
 *   1. Menambahkan modul Gradle `:watermelondb-jsi` ke settings.gradle
 *   2. Menambahkan `implementation project(':watermelondb-jsi')` ke app/build.gradle
 *   3. Mendaftarkan `WatermelonDBJSIPackage` di MainApplication.kt
 *   4. Menambahkan aturan keep ke proguard-rules.pro (R8 aktif di build release SDK 58;
 *      tanpa aturan ini JNI WatermelonDB ikut dibuang dan database gagal dibuka)
 *  iOS
 *   5. Menambahkan pod `simdjson` (versi npm yang di-vendor) ke Podfile
 *
 * Semua langkah idempoten dan akan melempar error jelas jika template native berubah,
 * supaya kegagalan terlihat saat prebuild, bukan baru saat aplikasi crash.
 */
const fs = require('fs');
const path = require('path');
const {
  withSettingsGradle,
  withAppBuildGradle,
  withMainApplication,
  withDangerousMod,
} = require('expo/config-plugins');

const JSI_IMPORT = 'import com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage';
const JSI_ADD = 'add(WatermelonDBJSIPackage())';
const PROGUARD_RULE = '-keep class com.nozbe.watermelondb.** { *; }';

function fail(message) {
  throw new Error(`[withWatermelonDB] ${message}`);
}

function withAndroidSettingsGradle(config) {
  return withSettingsGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(":watermelondb-jsi")) {
      mod.modResults.contents += `
include ':watermelondb-jsi'
project(':watermelondb-jsi').projectDir = new File(
  new File(["node", "--print", "require.resolve('@nozbe/watermelondb/package.json')"].execute(null, rootProject.projectDir).text.trim()).getParentFile(),
  "native/android-jsi"
)
`;
    }
    return mod;
  });
}

function withAndroidAppBuildGradle(config) {
  return withAppBuildGradle(config, (mod) => {
    const contents = mod.modResults.contents;
    if (!contents.includes("project(':watermelondb-jsi')")) {
      const marker = /^dependencies\s*\{/m;
      if (!marker.test(contents)) {
        fail('Blok `dependencies {` tidak ditemukan di android/app/build.gradle.');
      }
      mod.modResults.contents = contents.replace(
        marker,
        "dependencies {\n    implementation project(':watermelondb-jsi')\n"
      );
    }
    return mod;
  });
}

function withAndroidMainApplication(config) {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes(JSI_IMPORT)) {
      if (!contents.includes('import android.app.Application')) {
        fail('`import android.app.Application` tidak ditemukan di MainApplication.');
      }
      contents = contents.replace(
        'import android.app.Application',
        `import android.app.Application\n${JSI_IMPORT}`
      );
    }

    if (!contents.includes(JSI_ADD)) {
      const marker = /PackageList\(this\)\.packages\.apply\s*\{/;
      if (!marker.test(contents)) {
        fail(
          'Blok `PackageList(this).packages.apply {` tidak ditemukan di MainApplication. ' +
            'Template Android berubah; daftarkan WatermelonDBJSIPackage secara manual.'
        );
      }
      contents = contents.replace(marker, (match) => `${match}\n          ${JSI_ADD}`);
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withAndroidProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const file = path.join(mod.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (!current.includes(PROGUARD_RULE)) {
        const prefix = current.length === 0 || current.endsWith('\n') ? '' : '\n';
        fs.writeFileSync(file, `${current}${prefix}\n# WatermelonDB\n${PROGUARD_RULE}\n`);
      }
      return mod;
    },
  ]);
}

function withIosSimdjsonPod(config) {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const file = path.join(mod.modRequest.platformProjectRoot, 'Podfile');
      const current = fs.readFileSync(file, 'utf8');
      if (current.includes("pod 'simdjson'")) {
        return mod;
      }
      const marker = 'post_install do |installer|';
      if (!current.includes(marker)) {
        fail('Blok `post_install do |installer|` tidak ditemukan di Podfile.');
      }
      const pod =
        '# WatermelonDB: gunakan simdjson versi npm (bukan versi CocoaPods)\n' +
        '  pod \'simdjson\', path: File.dirname(`node --print "require.resolve(\'@nozbe/simdjson/package.json\')"`.strip), :modular_headers => true\n\n  ';
      fs.writeFileSync(file, current.replace(marker, `${pod}${marker}`));
      return mod;
    },
  ]);
}

module.exports = function withWatermelonDB(config) {
  config = withAndroidSettingsGradle(config);
  config = withAndroidAppBuildGradle(config);
  config = withAndroidMainApplication(config);
  config = withAndroidProguard(config);
  config = withIosSimdjsonPod(config);
  return config;
};
