import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    const mongoURI = process.env.MONGO_URI;

    const dbName = isProd
      ? process.env.PRODUCTION_DB_NAME
      : process.env.DEVELOPMENT_DB_NAME;

    if (!mongoURI || !dbName) {
      throw new Error("MongoDB environment variables are missing");
    }

    await mongoose.connect(mongoURI, {
      dbName,
    });

    console.log(`✅ MongoDB Connected`);
    console.log(`📂 Database: ${dbName}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error.message);
    process.exit(1);
  }
};
