/**
 * Fetch Google Doc via Drive export (does not need Docs API).
 * Prints preview + saves HTML for inspection.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config({ path: path.join(backendDir, ".env.local"), override: true });

const docId =
  process.env.GOOGLE_BLOG_DOC_ID?.trim() ||
  "14pjEY_D_n8G2YL8lCfTTd5eWAslNrcKghg5aI3wlkC0";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email,
  key,
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/documents",
  ],
});

await auth.authorize();
const drive = google.drive({ version: "v3", auth });

console.log("Trying Drive files.export text/html...");
try {
  const html = await drive.files.export(
    { fileId: docId, mimeType: "text/html" },
    { responseType: "text" },
  );
  const out = path.join(backendDir, "tmp-blog-export.html");
  fs.writeFileSync(out, String(html.data));
  console.log("HTML length:", String(html.data).length, "saved:", out);
  console.log(String(html.data).slice(0, 1500));
} catch (e) {
  console.error("HTML export failed:", e.message);
}

console.log("\nTrying Drive files.export text/plain...");
try {
  const txt = await drive.files.export(
    { fileId: docId, mimeType: "text/plain" },
    { responseType: "text" },
  );
  const out = path.join(backendDir, "tmp-blog-export.txt");
  fs.writeFileSync(out, String(txt.data));
  console.log("TXT length:", String(txt.data).length, "saved:", out);
  console.log(String(txt.data).slice(0, 2000));
} catch (e) {
  console.error("TXT export failed:", e.message);
}

console.log("\nTrying Docs API includeTabsContent...");
try {
  const docs = google.docs({ version: "v1", auth });
  const doc = await docs.documents.get({
    documentId: docId,
    includeTabsContent: true,
  });
  console.log(
    "tabs:",
    (doc.data.tabs || []).map((t) => t.tabProperties?.title),
  );
} catch (e) {
  console.error("Docs API failed:", e.message?.slice(0, 300));
}
