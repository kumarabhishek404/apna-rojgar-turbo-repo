module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // EAS file env vars resolve to absolute paths at build time.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile,
  },
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST || config.ios?.googleServicesFile,
  },
});
