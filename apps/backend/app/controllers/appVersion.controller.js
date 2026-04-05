import AppVersion from "../models/appVersion.model.js";
import { isVersionLess } from "../utils/version.js";

export const appVersionInformation = async (req, res) => {
  try {
    const { platform, currentVersion } = req.query;

    if (!platform || !currentVersion) {
      return res.status(400).json({
        message: "platform and currentVersion are required",
      });
    }

    const config = await AppVersion.findOne({ platform });

    if (!config) {
      return res.status(404).json({
        message: "Platform config not found",
      });
    }

    const forceUpdate = isVersionLess(
      currentVersion,
      config.minSupportedVersion,
    );

    return res.json({
      latestVersion: config.latestVersion,
      minSupportedVersion: config.minSupportedVersion,
      forceUpdate,
      updateMessage: forceUpdate ? "forceUpdateMessage" : undefined,
      playStoreUrl: config.storeUrl,
    });
  } catch (error) {
    console.error("App version check error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
