/**
 * Resolves the district for a free-text address using the canonical `states`
 * collection (state → district → subDistrict → villages).
 *
 * Addresses are written inconsistently — some name the district, some only a
 * village or a sub-district — so picking a positional segment produced a mix of
 * districts, villages and noise. Matching against the canonical hierarchy and
 * always reporting the district keeps the browse filter consistent.
 */
import State from "../models/state.model.js";

/** Rebuilt at most this often; district boundaries effectively never change. */
const REFRESH_MS = 12 * 60 * 60 * 1000;
/** Longest place name we try to match, in words (e.g. "Sri Potti Sriramulu Nellore"). */
const MAX_NGRAM = 5;
/** Below this, a lone word is too generic to identify a village or sub-district. */
const MIN_LOOSE_WORD = 4;
/** Stored instead of a district when a name is used by several districts of one state. */
const AMBIGUOUS = null;

const COUNTRY_SEGMENTS = new Set([
  "india",
  "bharat",
  "in",
  "usa",
  "भारत",
  "इंडिया",
  "हिंदुस्तान",
]);
const PIN_ONLY = /^\d{3,8}$/;
const PLUS_CODE = /^[a-z0-9]{4,}\+[a-z0-9]{2,}$/i;
const TRAILING_PIN = /[\s,-]+\d{5,8}$/;

/**
 * Words that describe a place rather than name one. A phrase made only of these
 * is skipped, otherwise "Navnath Nagar" matches a village literally called
 * "Nagar" and lands in whichever district happens to own it.
 */
const GENERIC_WORDS = new Set([
  "nagar", "colony", "road", "rd", "marg", "street", "gali", "lane", "cross",
  "main", "sector", "block", "phase", "plot", "shop", "house", "floor", "flat",
  "no", "number", "near", "opp", "opposite", "behind", "front", "vihar", "puram",
  "pura", "bazar", "bazaar", "market", "chowk", "extension", "layout", "park",
  "garden", "society", "apartment", "apartments", "tower", "residency", "enclave",
  "city", "town", "village", "gaon", "gram", "panchayat", "ward", "post",
  "tehsil", "district", "state", "new", "old", "east", "west", "north", "south",
  "upper", "lower", "mandir", "temple", "masjid", "church", "hospital", "school",
  "college", "station", "stand", "bus", "railway", "office", "the", "and", "at",
]);

/** Districts renamed or respelled since the dataset was compiled. */
const DISTRICT_ALIASES = new Map([
  ["gurugram", "gurgaon"],
  ["bengaluru", "bangalore"],
  ["bengaluru urban", "bangalore"],
  ["bangalore urban", "bangalore"],
  ["prayagraj", "allahabad"],
  ["ahmedabad", "ahmadabad"],
  ["beed", "bid"],
  ["kanpur", "kanpur nagar"],
  ["hooghly", "hugli"],
  ["haridwar", "hardwar"],
  ["nasik", "nashik"],
]);

/** Districts missing from the dataset's (2011 census) list but common in addresses. */
const EXTRA_DISTRICTS = new Map([
  ["maharashtra", ["Mumbai", "Mumbai Suburban", "Palghar"]],
  ["delhi", ["Delhi"]],
]);

/**
 * Districts reported under a single label. Delhi is nine administrative
 * districts but one city to anyone picking a place to work, and splitting it
 * would scatter the same listings across nine dropdown entries.
 */
const DISTRICT_MERGES = new Map(
  [
    "central delhi", "east delhi", "new delhi", "north delhi", "north east delhi",
    "north west delhi", "south delhi", "south west delhi", "west delhi",
  ].map((key) => [key, "Delhi"]),
);

/** State spellings that differ between geocoders and the dataset. */
const STATE_ALIASES = new Map([
  ["orissa", "odisha"],
  ["pondicherry", "puducherry"],
  ["uttaranchal", "uttarakhand"],
  ["nct of delhi", "delhi"],
  ["national capital territory of delhi", "delhi"],
  ["new delhi", "delhi"],
  ["jammu and kashmir", "jammu & kashmir"],
  ["andaman and nicobar islands", "andaman & nicobar islands"],
  ["dadra and nagar haveli", "dadra & nagar haveli"],
]);

export const normalizePlace = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .trim();

const cleanSegment = (segment) =>
  String(segment || "")
    .replace(TRAILING_PIN, "")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();

const isNoiseSegment = (segment) => {
  const key = normalizePlace(segment);
  if (!key) return true;
  if (COUNTRY_SEGMENTS.has(key)) return true;
  if (PIN_ONLY.test(key)) return true;
  if (PLUS_CODE.test(segment.trim())) return true;
  return false;
};

/** Address segments with country / PIN / plus-code noise removed, in original order. */
export const addressSegments = (address) =>
  String(address || "")
    .split(",")
    .map(cleanSegment)
    .filter((segment) => segment && !isNoiseSegment(segment));

const createScope = () => ({
  districts: new Map(),
  subDistricts: new Map(),
  villages: new Map(),
});

const keysFor = (name, { spaceless }) => {
  const key = normalizePlace(name);
  if (!key) return [];
  // "Yamuna Nagar" in an address vs "Yamunanagar" in the dataset.
  const packed = key.replace(/ /g, "");
  return spaceless && packed !== key ? [key, packed] : [key];
};

/** First writer wins; a later writer naming a different district marks it ambiguous. */
const remember = (map, name, district, { spaceless = false, unique = false } = {}) => {
  for (const key of keysFor(name, { spaceless })) {
    if (!map.has(key)) {
      map.set(key, district);
    } else if (unique && map.get(key) !== district) {
      map.set(key, AMBIGUOUS);
    }
  }
};

let cache = null;
let building = null;

async function buildIndex() {
  // Raw driver: schema casting 600k+ village strings costs seconds for no gain.
  const states = await State.collection.find({}).toArray();

  // Only districts are indexed nationally — sub-district and village names are
  // far too widely reused to mean anything without a state to scope them.
  const allDistricts = new Map();
  const byState = new Map();
  const stateNames = new Map();
  const districtOwner = new Map();

  for (const stateDoc of states) {
    const stateKey = normalizePlace(stateDoc.state);
    const scope = createScope();
    byState.set(stateKey, scope);
    stateNames.set(stateKey, stateKey);

    const registerDistrict = (name) => {
      const label = DISTRICT_MERGES.get(normalizePlace(name)) || name;
      districtOwner.set(normalizePlace(name), stateKey);
      remember(scope.districts, name, label, { spaceless: true });
      remember(allDistricts, name, label, { spaceless: true });
      return label;
    };

    for (const districtDoc of stateDoc.districts || []) {
      if (!districtDoc.district) continue;
      const label = registerDistrict(districtDoc.district);

      for (const subDoc of districtDoc.subDistricts || []) {
        remember(scope.subDistricts, subDoc.subDistrict, label, {
          spaceless: true,
          unique: true,
        });
        for (const village of subDoc.villages || []) {
          remember(scope.villages, village, label, { unique: true });
        }
      }
    }

    for (const name of EXTRA_DISTRICTS.get(stateKey) || []) registerDistrict(name);
  }

  for (const [alias, canonical] of STATE_ALIASES) {
    const stateKey = normalizePlace(canonical);
    if (byState.has(stateKey)) stateNames.set(alias, stateKey);
  }

  for (const [alias, canonical] of DISTRICT_ALIASES) {
    const label = allDistricts.get(canonical);
    if (!label) continue;
    const scope = byState.get(districtOwner.get(canonical));
    if (scope) remember(scope.districts, alias, label, { spaceless: true });
    remember(allDistricts, alias, label, { spaceless: true });
  }

  return { allDistricts, byState, stateNames, builtAt: Date.now() };
}

export async function getDistrictIndex() {
  if (cache && Date.now() - cache.builtAt < REFRESH_MS) return cache;
  if (!building) {
    building = buildIndex()
      .then((index) => {
        cache = index;
        return index;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

const isMeaningless = (words) =>
  words.every((word) => GENERIC_WORDS.has(word) || /^\d+$/.test(word));

/** Word n-grams of a segment, longest first so multi-word districts win. */
function* segmentNgrams(segment, { minWordLength = 1 } = {}) {
  const words = normalizePlace(segment).split(" ").filter(Boolean);
  for (let size = Math.min(MAX_NGRAM, words.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= words.length; start += 1) {
      const slice = words.slice(start, start + size);
      if (isMeaningless(slice)) continue;
      if (size === 1 && slice[0].length < minWordLength) continue;
      const key = slice.join(" ");
      yield key;
      const packed = key.replace(/ /g, "");
      if (packed !== key) yield packed;
    }
  }
}

/**
 * Districts sit near the end of an address, so later segments win over earlier
 * ones. Ambiguous hits are skipped rather than returned, which lets a unique
 * name further up the address decide instead.
 */
function lookupTier(map, segments, options) {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    for (const key of segmentNgrams(segments[i], options)) {
      const hit = map.get(key);
      if (hit) return hit;
    }
  }
  return "";
}

function detectStateScope(index, segments) {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    for (const key of segmentNgrams(segments[i])) {
      const stateKey = index.stateNames.get(key);
      if (stateKey) return index.byState.get(stateKey) || null;
    }
  }
  return null;
}

/**
 * Canonical district for an address, or "" when it cannot be determined.
 * A guessed village or street name is worse than no answer here, because the
 * browse dropdown promises every option maps to a real district.
 */
export function resolveDistrict(index, address) {
  const segments = addressSegments(address);
  if (!segments.length) return "";

  // Exhaust the address's own state before anything else: village and
  // sub-district names repeat all over India, so without a state to pin them
  // down they are guesses rather than evidence.
  const stateScope = detectStateScope(index, segments);
  if (stateScope) {
    const loose = { minWordLength: MIN_LOOSE_WORD };
    const hit =
      lookupTier(stateScope.districts, segments) ||
      lookupTier(stateScope.subDistricts, segments, loose) ||
      lookupTier(stateScope.villages, segments, loose);
    if (hit) return hit;
  }
  return lookupTier(index.allDistricts, segments);
}

export async function resolveDistrictFromAddress(address) {
  const index = await getDistrictIndex();
  return resolveDistrict(index, address);
}
