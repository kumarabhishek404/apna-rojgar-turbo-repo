/**
 * With `output: "export"`, Next only emits HTML for paths returned from
 * `generateStaticParams`. An empty array produces no prerendered routes and
 * the build fails with a misleading "missing generateStaticParams" error.
 *
 * We emit one placeholder path per dynamic segment so static hosting (e.g.
 * Render) can build. Real IDs still work when users navigate client-side from
 * list pages; a cold open or refresh to an arbitrary `/services/:id` URL on
 * static hosting may 404 unless you list those IDs at build time or use SSR.
 */
export const STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID = "__static";

export function staticExportDynamicParamList(): { id: string }[] {
  return [{ id: STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID }];
}
