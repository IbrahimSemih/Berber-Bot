// Web ile ortak saf TypeScript kodu (../shared) uygulama klasörünün dışında.
// shared/ bir npm workspace paketi olmadığı için Expo'nun otomatik monorepo
// ayarı onu görmez; Metro'ya elle tanıtılır.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, "../shared");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];
// shared/ içindeki "zod", "date-fns-tz" gibi import'lar mobilin kendi
// node_modules'ından çözülsün (EAS'te kök node_modules yoktur).
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
