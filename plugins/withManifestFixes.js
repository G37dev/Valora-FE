const { withAndroidManifest } = require("expo/config-plugins");

/*
 * Fix konflik manifest merger di Android:
 * - com.reown:sign (dependency Didit SDK) deklarasi android:dataExtractionRules
 *   dan android:fullBackupContent, tabrakan dengan nilai dari expo-secure-store.
 *   tools:replace dipakai supaya merger pakai nilai milik app kita.
 */
module.exports = function withManifestFixes(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return c;

    application.$["tools:replace"] =
      "android:dataExtractionRules,android:fullBackupContent";
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    return c;
  });
};
