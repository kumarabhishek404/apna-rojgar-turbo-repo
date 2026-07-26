/**
 * One-off: regenerate blog slugs from titles (title-based, no blog-tab ids).
 * Usage: node app/scripts/repairBlogSlugs.js
 */
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Blog, { slugifyBlogTitle } from "../models/blog.model.js";

const backendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(backendDir, ".env") });
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
const envPath = path.join(backendDir, envFile);
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true });

const uri = process.env.MONGO_URI;
const dbName =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_DB_NAME
    : process.env.DEVELOPMENT_DB_NAME;

if (!uri || !dbName) {
  console.error("Missing MONGO_URI or DEVELOPMENT_DB_NAME / PRODUCTION_DB_NAME");
  process.exit(1);
}

await mongoose.connect(uri, { dbName });
console.log(`Connected to ${dbName}`);
const blogs = await Blog.find({}).select("title slug");
console.log(`Found ${blogs.length} blogs`);

for (const blog of blogs) {
  const desired = slugifyBlogTitle(blog.title);
  let slug = desired;
  let n = 0;
  while (await Blog.exists({ slug, _id: { $ne: blog._id } })) {
    n += 1;
    slug = `${desired}-${n + 1}`;
  }
  if (slug !== blog.slug) {
    const prev = blog.slug;
    blog.slug = slug;
    await blog.save();
    console.log(`${prev} → ${slug}`);
  } else {
    console.log(`ok ${slug}`);
  }
}

await mongoose.disconnect();
console.log("Done");
