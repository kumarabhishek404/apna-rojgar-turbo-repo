// const { getDefaultConfig } = require("expo/metro-config");

// const config = getDefaultConfig(__dirname);

// // DO NOT blacklist node_modules
// // DO NOT override watchFolders unless you know why

// module.exports = config;

// const { getDefaultConfig } = require("expo/metro-config");
// const path = require("path");

// const projectRoot = __dirname;
// const workspaceRoot = path.resolve(projectRoot, "../..");

// const config = getDefaultConfig(projectRoot);

// config.watchFolders = [workspaceRoot];
// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, "node_modules"),
//   path.resolve(workspaceRoot, "node_modules"),
// ];
// // pnpm + hoisted layout: resolve packages from the workspace root reliably
// // config.resolver.disableHierarchicalLookup = true;

// module.exports = config;


const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ✅ Merge watchFolders instead of overriding
config.watchFolders = [
  ...config.watchFolders,
  workspaceRoot,
];

// ✅ Ensure proper module resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// ✅ Prevent duplicate React instances (VERY important)
// config.resolver.disableHierarchicalLookup = true;

module.exports = config;