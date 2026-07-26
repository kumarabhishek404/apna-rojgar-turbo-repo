import crypto from "crypto";
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    authorName: {
      type: String,
      default: "Apna Rojgar",
      trim: true,
    },
    source: {
      type: String,
      enum: ["MANUAL", "GOOGLE_DOC", "GOOGLE_SHEET"],
      default: "MANUAL",
    },
    /** Stable id from Google Doc / sheet row — used to block re-imports. */
    googleSourceId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    /** Hash of normalized title+content — blocks duplicate body posts. */
    contentHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

blogSchema.index({ status: 1, publishedAt: -1 });

export function normalizeBlogText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildBlogContentHash(title, content) {
  const payload = `${normalizeBlogText(title)}\n${normalizeBlogText(content)}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** Basic Devanagari → Latin so Hindi titles become SEO-friendly URL slugs. */
const DEVANAGARI_TO_LATIN = {
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "i",
  उ: "u",
  ऊ: "u",
  ऋ: "ri",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "ng",
  च: "ch",
  छ: "chh",
  ज: "j",
  झ: "jh",
  ञ: "ny",
  ट: "t",
  ठ: "th",
  ड: "d",
  ढ: "dh",
  ण: "n",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "v",
  श: "sh",
  ष: "sh",
  स: "s",
  ह: "h",
  "क्ष": "ksh",
  "त्र": "tr",
  "ज्ञ": "gy",
  "ा": "a",
  "ि": "i",
  "ी": "i",
  "ु": "u",
  "ू": "u",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "ं": "n",
  "ँ": "n",
  "ः": "h",
  "्": "",
  "़": "",
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

function transliterateForSlug(text = "") {
  let out = "";
  const raw = String(text);
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === "क" && raw[i + 1] === "्" && raw[i + 2] === "ष") {
      out += "ksh";
      i += 2;
      continue;
    }
    if (raw[i] === "त" && raw[i + 1] === "्" && raw[i + 2] === "र") {
      out += "tr";
      i += 2;
      continue;
    }
    if (raw[i] === "ज" && raw[i + 1] === "्" && raw[i + 2] === "ञ") {
      out += "gy";
      i += 2;
      continue;
    }
    const ch = raw[i];
    if (DEVANAGARI_TO_LATIN[ch] !== undefined) {
      out += DEVANAGARI_TO_LATIN[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Title → URL slug (no "blog-" / id prefixes).
 * Hindi titles are transliterated to Latin kebab-case.
 */
export function slugifyBlogTitle(title) {
  const transliterated = transliterateForSlug(title);
  const base = String(transliterated || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);

  if (base) return base;
  // Last resort: short stable token from title hash (still not an opaque DB id in the path alone)
  const digest = crypto
    .createHash("sha1")
    .update(String(title || "post"))
    .digest("hex")
    .slice(0, 10);
  return `career-tip-${digest}`;
}

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
