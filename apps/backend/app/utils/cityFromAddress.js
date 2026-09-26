/**
 * Cities for the browse filters. There is no `city` field on users or services —
 * only a free-text `address` — so each address is resolved to its district via
 * the canonical `states` hierarchy (see `districtIndex.js`).
 *
 * The district is often absent from the address itself ("Shakrauli, Uttar
 * Pradesh" is in Etah), so a city filter cannot be a regex over `address`.
 * Instead the distinct addresses of a listing are grouped by district once and
 * the filter becomes an `$in` over the addresses belonging to the chosen one.
 */
import { getDistrictIndex, resolveDistrict } from "./districtIndex.js";

/** Listings change far more slowly than they are browsed. */
const CACHE_MS = 60 * 1000;

const cache = new Map();

const cityKeyOf = (city) => String(city || "").trim().toLowerCase();

/**
 * `Map<city, { city, count, addresses }>` for every distinct address under
 * `match`. Grouping by address first keeps the district resolution work
 * proportional to the number of distinct places, not the number of listings.
 */
async function groupAddressesByCity(Model, match) {
  const key = `${Model.modelName}:${JSON.stringify(match)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.buckets;

  const [rows, index] = await Promise.all([
    Model.aggregate([
      { $match: { ...match, address: { $type: "string", $ne: "" } } },
      { $group: { _id: "$address", count: { $sum: 1 } } },
    ]),
    getDistrictIndex(),
  ]);

  const buckets = new Map();
  for (const row of rows) {
    const city = resolveDistrict(index, row._id);
    if (!city) continue;
    const bucket = buckets.get(cityKeyOf(city)) || { city, count: 0, addresses: [] };
    bucket.count += Number(row.count) || 0;
    bucket.addresses.push(row._id);
    buckets.set(cityKeyOf(city), bucket);
  }

  cache.set(key, { at: Date.now(), buckets });
  return buckets;
}

/** Districts with at least one listing under `match`, busiest first. */
export async function listCities(Model, match) {
  const buckets = await groupAddressesByCity(Model, match);
  return Array.from(buckets.values())
    .map(({ city, count }) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

/**
 * Condition for the `address` field restricting results to `city`, or null when
 * no city is selected. An unknown city yields an empty `$in` — no results —
 * which is the honest answer for a district nobody is listed in.
 */
export async function buildCityAddressFilter(Model, match, city) {
  if (!cityKeyOf(city)) return null;
  const buckets = await groupAddressesByCity(Model, match);
  return { $in: buckets.get(cityKeyOf(city))?.addresses ?? [] };
}

/** Attaches the derived district to listings so clients can show and group by it. */
export async function attachCities(items) {
  if (!Array.isArray(items) || !items.length) return items;
  const index = await getDistrictIndex();
  return items.map((item) => {
    const plain = typeof item?.toObject === "function" ? item.toObject() : item;
    return { ...plain, city: resolveDistrict(index, plain?.address) };
  });
}
