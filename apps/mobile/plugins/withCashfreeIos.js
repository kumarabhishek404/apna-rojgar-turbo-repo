const { withInfoPlist } = require("@expo/config-plugins");

const UPI_SCHEMES = [
  "amazonpay",
  "upi",
  "credpay",
  "bhim",
  "paytmmp",
  "phonepe",
  "tez",
  "navipay",
  "mobikwik",
  "myairtel",
  "popclubapp",
  "super",
  "kiwi",
];

/**
 * Cashfree RN SDK needs UPI app query schemes on iOS for intent checkout.
 * @see https://www.cashfree.com/docs/react-native-integration
 */
module.exports = function withCashfreeIos(config) {
  return withInfoPlist(config, (config) => {
    const existing = config.modResults.LSApplicationQueriesSchemes || [];
    config.modResults.LSApplicationQueriesSchemes = Array.from(
      new Set([...existing, ...UPI_SCHEMES]),
    );
    return config;
  });
};
