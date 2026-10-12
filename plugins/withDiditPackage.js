const {
  withMainApplication,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/*
 * Daftar ulang SdkReactNativeModule (Didit) tanpa getReactModuleInfoProvider()
 * bawaan SDK yang pakai reflection konstruktor (issue #61) — menyebabkan modul
 * tidak ke-register di TurboModuleManager ("SdkReactNative could not be found").
 *
 * Plugin ini:
 * 1. Menulis DiditReactPackage.kt (ReactModuleInfo dibuat langsung).
 * 2. Menambahkan add(DiditReactPackage()) ke MainApplication.kt.
 */

const PKG_KT = `package com.valora.valoramobile

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.sdkreactnative.SdkReactNativeModule

class DiditReactPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == SdkReactNativeModule.NAME) SdkReactNativeModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      SdkReactNativeModule.NAME to
        ReactModuleInfo(
          SdkReactNativeModule.NAME,
          SdkReactNativeModule.NAME,
          false,
          false,
          false,
          true,
        ),
    )
  }
}
`;

function withDiditPackage(config) {
  config = withDangerousMod(config, [
    "android",
    async (c) => {
      const dir = path.join(
        c.modRequest.platformProjectRoot,
        "app/src/main/java/com/valora/valoramobile",
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "DiditReactPackage.kt"), PKG_KT);
      return c;
    },
  ]);

  config = withMainApplication(config, (c) => {
    const src = c.modResults.contents;
    if (src.includes("add(DiditReactPackage())")) return c;
    c.modResults.contents = src.replace(
      /packages\.apply\s*\{([\s\S]*?)\}/,
      (m, inner) => `packages.apply {${inner}\n          add(DiditReactPackage())\n        }`,
    );
    return c;
  });

  return config;
}

module.exports = withDiditPackage;
