const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/*
 * Fix konflik manifest merger MLKit di debug build:
 * expo-dev-launcher deklarasi com.google.mlkit.vision.DEPENDENCIES=barcode_ui,
 * Sumsub SDK deklarasi value=face → merger gagal.
 * Inject meta-data gabungan (barcode_ui,face) + tools:replace di
 * android/app/src/debug/AndroidManifest.xml saat prebuild.
 * Release nggak kena — dev-launcher nggak ikut ke release manifest.
 */
module.exports = function withSumsubManifestFix(config) {
  return withDangerousMod(config, [
    "android",
    async (c) => {
      const file = path.join(
        c.modRequest.platformProjectRoot,
        "app/src/debug/AndroidManifest.xml",
      );
      if (!fs.existsSync(file)) return c;

      let src = fs.readFileSync(file, "utf8");
      if (src.includes("com.google.mlkit.vision.DEPENDENCIES")) return c;

      const meta =
        '\n        <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui,face" tools:replace="android:value"/>';

      if (src.includes("tools:replace=\"android:usesCleartextTraffic\" />")) {
        src = src.replace(
          'tools:replace="android:usesCleartextTraffic" />',
          'tools:replace="android:usesCleartextTraffic">' + meta + "\n    </application>",
        );
      } else {
        src = src.replace("</application>", meta + "\n    </application>");
      }

      fs.writeFileSync(file, src);
      return c;
    },
  ]);
};
