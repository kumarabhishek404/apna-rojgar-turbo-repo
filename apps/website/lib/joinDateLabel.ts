function parseJoinDate(createdAt?: string | null) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  return `${day} ${month}, ${date.getFullYear()}`;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"} ago`;
}

/** 10 minutes ago · 2 hours ago · 1 day ago · 22 Sep, 2026 */
export function formatJoinLabel(createdAt?: string | null) {
  const date = parseJoinDate(createdAt);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return shortDate(date);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");

  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day");

  return shortDate(date);
}

export function formatJoinExact(createdAt?: string | null) {
  const date = parseJoinDate(createdAt);
  if (!date) return "";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
