/**
 * Normalize + validate service requirement rows before API submit.
 * Mongoose requires a finite payPerDay; JSON.stringify(NaN) becomes null and fails.
 */

/** Employers must enter daily wage of at least this amount (₹). */
export const MIN_PAY_PER_DAY = 500;

export type ServiceRequirementInput = {
  name?: string;
  count?: number | string;
  payPerDay?: number | string | null;
};

export function parsePayPerDay(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function normalizeRequirements(
  requirements: ServiceRequirementInput[] | undefined | null,
): Array<{ name: string; count: number; payPerDay: number }> {
  if (!Array.isArray(requirements)) return [];
  return requirements.map((item) => {
    const pay = parsePayPerDay(item?.payPerDay);
    const count = Number(item?.count);
    return {
      name: String(item?.name || "").trim(),
      count: Number.isFinite(count) ? count : 0,
      payPerDay: pay == null ? NaN : pay,
    };
  });
}

/** Returns a user-facing error key/message, or null if valid. */
export function getRequirementsValidationError(
  requirements: ServiceRequirementInput[] | undefined | null,
): string | null {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return "selectAWorker";
  }

  for (let i = 0; i < requirements.length; i += 1) {
    const item = requirements[i];
    if (!item?.name) {
      return "selectAWorker";
    }
    const count = Number(item.count);
    if (!Number.isFinite(count) || count < 1) {
      return "totalRequiredMustBeGreaterThan0";
    }
    const pay = parsePayPerDay(item.payPerDay);
    if (pay == null) {
      return "payPerDayIsRequired";
    }
    if (pay < MIN_PAY_PER_DAY) {
      return "payPerDayMustBeAtLeast500";
    }
  }

  return null;
}

/** Field-level check while the employer types pay per day. Empty is not an error until save. */
export function getPayPerDayFieldError(value: unknown): string | null {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) return null;
  const pay = parsePayPerDay(raw);
  if (pay == null) return "payPerDayShouldBeInNumber";
  if (pay < MIN_PAY_PER_DAY) return "payPerDayMustBeAtLeast500";
  return null;
}
