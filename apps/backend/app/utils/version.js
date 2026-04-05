export function isVersionLess(current, minimum) {
  if (!current || !minimum) return false;

  const c = current.split(".").map(Number);
  const m = minimum.split(".").map(Number);

  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cv = c[i] || 0;
    const mv = m[i] || 0;

    if (cv < mv) return true;
    if (cv > mv) return false;
  }

  return false;
}