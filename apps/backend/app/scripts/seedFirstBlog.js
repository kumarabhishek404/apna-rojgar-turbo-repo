/**
 * Seed one starter blog so /blogs is not empty while Google Docs API is enabled.
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Blog, {
  buildBlogContentHash,
  slugifyBlogTitle,
} from "../models/blog.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config({
  path: path.join(backendDir, ".env.local"),
  override: true,
});

const mongoUri = process.env.MONGO_URI?.trim();
const dbName = process.env.DEVELOPMENT_DB_NAME || "LOCAL_LABOUR_APP";

const title = "अपने आसपास नौकरी कैसे खोजें? आसान और सही तरीका";
const content = `आजकल आसपास काम या नौकरी ढूँढना आसान नहीं लगता। कई लोगों को पता ही नहीं चलता कि पास में कौन-सा काम उपलब्ध है, किसे मजदूर चाहिए, या कहाँ हेल्पर/मिस्त्री की जरूरत है।

अपना रोज़गार इसी समस्या को आसान बनाता है। आप मोबाइल से ही अपने इलाके के काम देख सकते हैं, आवेदन कर सकते हैं, और नियोक्ता भी सही कर्मचारी जल्दी ढूँढ सकते हैं।

क्यों ज़रूरी है लोकल काम खोजना?
• घर के पास काम से समय और किराया बचता है
• रोज़ाना या अल्पकालिक काम आसानी से मिल सकते हैं
• भरोसेमंद लोग और साफ़ जानकारी एक जगह मिलती है

अपना रोज़गार पर कैसे शुरू करें?
1. ऐप या वेबसाइट पर रजिस्टर करें
2. अपना स्किल और इलाका अपडेट करें
3. पास के काम देखें और आवेदन करें

अगर आप नियोक्ता हैं, तो काम पोस्ट करें और सही मजदूर/हेल्पर/मिस्त्री से जल्दी जुड़ें।

सही मौका आपके आसपास ही हो सकता है — बस सही जगह देखना बाकी है।`;

await mongoose.connect(mongoUri, { dbName });

const contentHash = buildBlogContentHash(title, content);
const existing = await Blog.findOne({
  $or: [
    { contentHash },
    { slug: "apne-aaspas-naukri-kaise-khojen" },
    { title },
  ],
});

if (existing) {
  console.log("Blog already exists:", existing.slug);
  await mongoose.disconnect();
  process.exit(0);
}

let slug = slugifyBlogTitle(title);
if (!slug || slug.startsWith("blog-")) {
  slug = "apne-aaspas-naukri-kaise-khojen";
}

const blog = await Blog.create({
  title,
  slug,
  excerpt:
    "आसपास नौकरी और काम कैसे खोजें — अपना रोज़गार के साथ आसान और सही तरीका।",
  content,
  coverImageUrl: "",
  status: "PUBLISHED",
  publishedAt: new Date(),
  authorName: "Apna Rojgar",
  source: "MANUAL",
  contentHash,
});

console.log(
  JSON.stringify(
    { ok: true, id: blog._id.toString(), slug: blog.slug, title: blog.title },
    null,
    2,
  ),
);
await mongoose.disconnect();
