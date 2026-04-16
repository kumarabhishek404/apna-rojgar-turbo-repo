const appJson = require("./app.json");

module.exports = () => {
  const expoConfig = appJson.expo;

  return {
    ...expoConfig,
    android: {
      ...expoConfig.android,
      // EAS file env vars resolve to an absolute path at build time.
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || expoConfig.android?.googleServicesFile,
    },
    ios: {
      ...expoConfig.ios,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_INFO_PLIST ||
        expoConfig.ios?.googleServicesFile,
    },
  };
};
