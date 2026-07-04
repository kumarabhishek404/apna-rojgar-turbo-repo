const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Overrides portrait / orientation locks from third-party SDKs (Cashfree,
 * ML Kit, Credentials) so Google Play no longer flags large-screen
 * resizability restrictions on Android 16+.
 *
 * Libraries ship activities with `android:screenOrientation="portrait"`.
 * We re-declare them with `tools:replace` so the manifest merger uses
 * `unspecified` at build time. Payment and scanner UI still work; the OS
 * may allow rotation on tablets/foldables.
 */
const ORIENTATION_UNLOCK_ACTIVITIES = [
  "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity",
  "com.cashfree.pg.core.api.ui.CashfreeSubscriptionCheckoutActivity",
  "com.cashfree.pg.core.api.ui.CashfreeSubscriptionVerificationActivity",
  "com.cashfree.pg.core.api.ui.CashfreeCoreNativeVerificationActivity",
  "com.cashfree.pg.ui.hidden.checkout.CashfreeNativeCheckoutActivity",
  "com.cashfree.pg.core.api.ui.CFSubsCoreUpiPaymentActivity",
  "com.cashfree.pg.core.api.ui.CashfreeWebCheckoutActivity",
  "androidx.credentials.playservices.HiddenActivity",
];

function unlockActivityOrientation(app, activityName) {
  const existing = app.activity.find(
    (a) => a.$?.["android:name"] === activityName,
  );

  const attrs = {
    "android:name": activityName,
    "android:screenOrientation": "unspecified",
    "android:resizeableActivity": "true",
    "tools:replace": "android:screenOrientation,android:resizeableActivity",
  };

  if (existing) {
    existing.$ = { ...existing.$, ...attrs };
    return;
  }

  app.activity.push({ $: attrs });
}

module.exports = function withAndroidOrientationFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const app = manifest.application?.[0];
    if (!app) return config;

    if (!app.activity) app.activity = [];

    for (const activityName of ORIENTATION_UNLOCK_ACTIVITIES) {
      unlockActivityOrientation(app, activityName);
    }

    return config;
  });
};
