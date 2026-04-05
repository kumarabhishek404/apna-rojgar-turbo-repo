import mongoose from "mongoose";
import AppVersion from "../models/appVersion.model.js";

async function seed() {
  try {
    mongoose.connect(
      "mongodb+srv://ak7192837:W2rYq5We8gOdPZAo@labour-cluter.xsqg7.mongodb.net/LABOUR_APP",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("✅ MongoDB connected");

    await AppVersion.deleteMany({});
    console.log("🧹 Old app version config removed");

    await AppVersion.insertMany([
      {
        platform: "android",
        latestVersion: "1.0.15",
        minSupportedVersion: "1.0.15",
        storeUrl:
          "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
      },
      {
        platform: "ios",
        latestVersion: "1.0.12",
        minSupportedVersion: "1.0.10",
        storeUrl: "https://apps.apple.com/app/idXXXXXXXX",
      },
    ]);

    console.log("✅ App version config seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
