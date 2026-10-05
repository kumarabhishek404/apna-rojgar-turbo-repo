/**
 * Normalize + validate service requirement rows before API submit.
 * Mongoose requires a finite payPerDay; JSON.stringify(NaN) becomes null and fails.
 *
 * Bounds match Indian daily-wage / skilled day rates for this marketplace.
 */

/** Employers must enter daily wage of at least this amount (₹). */
export const MIN_PAY_PER_DAY = 500;

/**
 * Upper bound for pay per day (₹).
 * Already extreme for blue-collar / skilled day work; rejects fake spam amounts.
 */
export const MAX_PAY_PER_DAY = 50_000;

export type ServiceRequirementInput = {
  name?: string;
  count?: number | string;
  payPerDay?: number | string | null;
};

export function parsePayPerDay(value: unknown): number | null {
  if (value == null || value === "") return null;
  const raw = typeof value === "number" ? value : String(value).trim();
  if (typeof raw === "string" && !/^\d+(\.\d+)?$/.test(raw)) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** True when pay is a whole-rupee amount inside the Indian-market range. */
export function isValidPayPerDay(pay: number | null): boolean {
  if (pay == null) return false;
  if (!Number.isInteger(pay) || !Number.isSafeInteger(pay)) return false;
  return pay >= MIN_PAY_PER_DAY && pay <= MAX_PAY_PER_DAY;
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
    if (!Number.isInteger(pay) || !Number.isSafeInteger(pay)) {
      return "payPerDayInvalid";
    }
    if (pay < MIN_PAY_PER_DAY) {
      return "payPerDayMustBeAtLeast500";
    }
    if (pay > MAX_PAY_PER_DAY) {
      return "payPerDayTooHigh";
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
  if (!Number.isInteger(pay) || !Number.isSafeInteger(pay)) return "payPerDayInvalid";
  if (pay < MIN_PAY_PER_DAY) return "payPerDayMustBeAtLeast500";
  if (pay > MAX_PAY_PER_DAY) return "payPerDayTooHigh";
  return null;
}
