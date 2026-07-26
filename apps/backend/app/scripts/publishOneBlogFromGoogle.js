/**
 * One-off: publish the next pending Google Doc tab as a website blog.
 * Usage: node app/scripts/publishOneBlogFromGoogle.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { publishNextPendingBlogFromGoogle } from "../utils/blogGoogleImport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config({
  path: path.join(
    backendDir,
    process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
  ),
  override: true,
});

const mongoUri = process.env.MONGO_URI?.trim();
const dbName =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_DB_NAME
    : process.env.DEVELOPMENT_DB_NAME;

if (!mongoUri) {
  console.error("MONGO_URI is missing");
  process.exit(1);
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
console.log(`Connected to MongoDB (${dbName || "default"})`);

try {
  const result = await publishNextPendingBlogFromGoogle();
  console.log(JSON.stringify(result, null, 2));
  if (result.failed) process.exitCode = 1;
} catch (error) {
  console.error("Publish failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
