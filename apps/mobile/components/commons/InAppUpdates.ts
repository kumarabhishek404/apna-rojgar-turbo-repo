import { t } from "@/utils/translationHelper";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export async function checkForUpdates() {
  try {
    // OTA updates only run in release/production builds — not Metro dev or dev client.
    if (__DEV__ || !Updates.isEnabled) return;

    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      Alert.alert(
        t("updateAvailable"),
        t("newVersionIsAvailable"),
        [
          {
            text: t("restart"),
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (e) {
                console.log("Update failed:", e);
              }
            },
          },
          {
            text: t("later"),
            style: "cancel",
          },
        ],
        { cancelable: false },
      );
    }
  } catch (error) {
    // Expected in dev builds — avoid noisy logs during local development.
    if (!__DEV__) {
      console.log("Error checking updates:", error);
    }
  }
}
