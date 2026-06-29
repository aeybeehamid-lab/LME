const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Transform packages that use private class fields
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

module.exports = config;