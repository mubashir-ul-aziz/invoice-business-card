// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads its wa-sqlite engine as a .wasm
// asset (Section 6 — SQLite is used on every platform, web included, for
// local dev/preview). Metro doesn't treat `.wasm` as an asset by default.
config.resolver.assetExts.push('wasm');

module.exports = config;
