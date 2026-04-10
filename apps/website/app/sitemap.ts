// Static export (Render `out/`) requires an explicit static hint for metadata routes.
export const dynamic = "force-static";

export default function sitemap() {
  return [
    {
      url: "https://apnarojgarindia.com",
      lastModified: new Date(),
    },
  ];
}
