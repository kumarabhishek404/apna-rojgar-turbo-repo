/**
 * With `output: "export"`, Next only emits HTML for paths returned from
 * `generateStaticParams`. An empty array produces no prerendered routes and
 * the build fails with a misleading "missing generateStaticParams" error.
 *
 * We always include a placeholder so the build succeeds. For `/services/[id]`,
 * `staticExportDynamicParamListAsync` also pulls service IDs from the API at
 * build time so direct links like `/services/<mongoId>` exist on static hosts
 * (e.g. Render). Deploy the backend route `GET .../service/public/service-ids`
 * before relying on that; if the fetch fails, behavior falls back to placeholder-only.
 */
export const STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID = "__static";
export const STATIC_EXPORT_DYNAMIC_LITERAL_ID = "[id]";

function apiBaseUrlV1(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
  return raw.replace(/\/$/, "");
}

export function staticExportDynamicParamList(): { id: string }[] {
  return [
    { id: STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID },
    // Defensive fallback when any stale link accidentally points to `/services/[id]`.
    { id: STATIC_EXPORT_DYNAMIC_LITERAL_ID },
  ];
}

/** Use in `generateStaticParams` for service detail routes when using static export. */
export async function staticExportDynamicParamListAsync(): Promise<{ id: string }[]> {
  const ids = new Set<string>();
  ids.add(STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID);
  ids.add(STATIC_EXPORT_DYNAMIC_LITERAL_ID);

  try {
    const limit = 200;
    let page = 1;
    let pages = 1;
    const base = apiBaseUrlV1();

    do {
      const url = `${base}/service/public/service-ids?page=${page}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(
          `[static export] ${url} returned ${res.status}; only placeholder service paths will be prerendered.`,
        );
        break;
      }
      const json = (await res.json()) as {
        success?: boolean;
        data?: { ids?: string[]; pages?: number };
      };
      if (!json?.success || !Array.isArray(json?.data?.ids)) {
        console.warn(
          "[static export] Unexpected response from public/service-ids; only placeholder service paths will be prerendered.",
        );
        break;
      }
      for (const id of json.data.ids) {
        if (id && id !== STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) ids.add(id);
      }
      pages = typeof json.data.pages === "number" && json.data.pages > 0 ? json.data.pages : 1;
      page += 1;
    } while (page <= pages);
  } catch (e) {
    console.warn(
      "[static export] Could not fetch service ids for generateStaticParams; only placeholder paths will be emitted.",
      e,
    );
  }

  return Array.from(ids).map((id) => ({ id }));
}
