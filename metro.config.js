const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Memperbaiki resolusi modul untuk library pihak ketiga tertentu
config.resolver.sourceExts.push("cjs");

module.exports = config;
