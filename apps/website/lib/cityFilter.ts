const norm = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim();

/**
 * The city is the district the backend resolved from the listing's address; it
 * is frequently absent from the address text itself, so never re-derive it here.
 * Listings whose district could not be determined belong to no city.
 */
export function matchesCity(item: { city?: unknown }, city: string): boolean {
  const target = norm(city);
  if (!target) return true;
  return norm(item?.city) === target;
}

/** Works store required skills on `requirements[].name`. */
export function matchesSkill(
  item: { requirements?: Array<{ name?: unknown }> },
  skill: string,
): boolean {
  const target = norm(skill);
  if (!target) return true;
  return (item?.requirements ?? []).some((entry) => norm(entry?.name) === target);
}
