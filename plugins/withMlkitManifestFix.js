const { withAndroidManifest } = require("expo/config-plugins");

/*
 * Konflik manifest merger:
 * - expo-dev-launcher deklarasi com.google.mlkit.vision.DEPENDENCIES = "barcode_ui"
 * - com.veriff:mlkit deklarasi nilai yang sama = "face"
 * Gabungkan jadi "barcode_ui,face" dengan tools:replace supaya merger tidak gagal.
 */
module.exports = function withMlkitManifestFix(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return c;

    const metaName = "com.google.mlkit.vision.DEPENDENCIES";
    application["meta-data"] = application["meta-data"] || [];

    const existing = application["meta-data"].find(
      (m) => m.$?.["android:name"] === metaName,
    );

    if (existing) {
      existing.$["android:value"] = "barcode_ui,face";
      existing.$["tools:replace"] = "android:value";
    } else {
      application["meta-data"].push({
        $: {
          "android:name": metaName,
          "android:value": "barcode_ui,face",
          "tools:replace": "android:value",
        },
      });
    }

    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    return c;
  });
};
