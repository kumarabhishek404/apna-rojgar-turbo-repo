import en from "../../mobile/app/locales/en.json";

const dictionary = en as Record<string, unknown>;

const overrides: Record<string, string> = {
  ios: "iOS",
  web: "Website",
  android: "Android",
};

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readEntry(entry: unknown) {
  if (typeof entry === "string" && entry.trim()) return entry.trim();
  if (entry && typeof entry === "object") {
    const row = entry as Record<string, unknown>;
    const pick = row.singular ?? row.label ?? row.name ?? row.plural;
    if (typeof pick === "string" && pick.trim()) return pick.trim();
  }
  return "";
}

/** English label for a stored key such as `homeMaintenance` or `CANCELLED`. */
export function label(value?: string | null, fallback = "—") {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return fallback;
  const keys = [raw, raw.toLowerCase()];
  for (const key of keys) {
    if (overrides[key]) return overrides[key];
    const text = readEntry(dictionary[key]);
    if (text && text.toLowerCase() !== key.toLowerCase()) return text;
  }
  return humanize(raw);
}

export function labelList(value?: string | null, fallback = "—") {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return fallback;
  return raw
    .split(",")
    .map((part) => label(part.trim(), part.trim()))
    .filter(Boolean)
    .join(", ");
}
