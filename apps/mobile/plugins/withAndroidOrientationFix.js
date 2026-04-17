const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Config plugin that overrides the MLKit barcode scanner activity's
 * `screenOrientation` restriction (portrait-only) which Google Play
 * flags as a user-experience issue on large-screen / foldable devices
 * running Android 16+.
 *
 * The GmsBarcodeScanningDelegateActivity ships inside the ML Kit SDK
 * with `android:screenOrientation="portrait"` locked in its manifest.
 * This plugin declares the same activity in the app's merged manifest
 * with `tools:replace` so the Android manifest merger substitutes
 * our unrestricted value at build time.
 */
module.exports = function withAndroidOrientationFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure the tools XML namespace is declared on the root element.
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const app = manifest.application?.[0];
    if (!app) return config;

    if (!app.activity) app.activity = [];

    const MLKIT_ACTIVITY =
      "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity";

    const existing = app.activity.find(
      (a) => a.$?.["android:name"] === MLKIT_ACTIVITY,
    );

    if (existing) {
      // Activity already declared — remove the orientation lock and tell
      // the merger to use our value instead of the library's.
      delete existing.$["android:screenOrientation"];
      existing.$["tools:replace"] = "android:screenOrientation";
    } else {
      // Not yet declared — add an override entry. The merger will see
      // `tools:replace` and prefer our value over the library's.
      app.activity.push({
        $: {
          "android:name": MLKIT_ACTIVITY,
          "android:screenOrientation": "unspecified",
          "tools:replace": "android:screenOrientation",
        },
      });
    }

    return config;
  });
};
