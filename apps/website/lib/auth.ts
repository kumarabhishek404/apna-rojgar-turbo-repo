import { AUTH_STORAGE_KEY, authAtom, authStore, StoredAuth } from "@/lib/authAtom";
import { getClientAppLanguage, localizeApiErrorMessage, translate } from "@/lib/i18n";
import { reportError } from "@/lib/reportError";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";

/** So `/auth/register` and `/auth/login` (auto-create user) persist `registrationSource: "web"`. */
const WEB_AUTH_JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "X-Client-Platform": "web",
};

type RegisterPayload = {
  mobile: string;
  countryCode: string;
  locale: string;
  source?: "web";
};

type LoginPayload = {
  mobile: string;
  otp?: string;
  /** From send-OTP response; pass on verify so load-balanced APIs need no shared cache. */
  otpSessionId?: string;
  /** Set by loginUser for new-user creation; omit from call sites. */
  source?: "web";
};

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: WEB_AUTH_JSON_HEADERS,
    body: JSON.stringify({ ...payload, source: "web" }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    const raw = data?.message;
    const lang = getClientAppLanguage();
    const msg =
      typeof raw === "string" && raw.trim()
        ? localizeApiErrorMessage(raw)
        : translate(lang, "registrationFailed", "Registration failed");
    throw new Error(msg);
  }

  return data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: WEB_AUTH_JSON_HEADERS,
    body: JSON.stringify({ ...payload, source: "web" }),
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    const raw = data?.message;
    const lang = getClientAppLanguage();
    const msg =
      typeof raw === "string" && raw.trim()
        ? localizeApiErrorMessage(raw)
        : translate(lang, "loginFailed", "Login failed");
    throw new Error(msg);
  }

  return data;
}

const AUTH_REDIRECT_KEY = "auth_redirect_in_flight";
/** Debounce only — a sticky "1" flag previously blocked retries after a cancelled redirect. */
const AUTH_REDIRECT_TTL_MS = 2500;

export function saveAuth(data: StoredAuth) {
  authStore.set(authAtom, data);
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  }
}

export function getAuth(): StoredAuth | null {
  const atomValue = authStore.get(authAtom);
  if (atomValue?.token) return atomValue;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return atomValue || null;
      const parsed = JSON.parse(raw) as StoredAuth;
      if (parsed?.token) {
        authStore.set(authAtom, parsed);
      }
      return parsed;
    } catch {
      return atomValue || null;
    }
  }

  return atomValue || null;
}

export function clearAuth() {
  authStore.set(authAtom, null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Hard-navigate to home + login after session death.
 * Uses location.assign so Next soft navigations (e.g. router.replace("/all-services"))
 * cannot keep the user inside the authenticated dashboard shell.
 * Also reloads `/` → `/?login=1` so the home page drops the in-place dashboard view.
 */
export function redirectToLoginIfNeeded() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const alreadyOnLoginPrompt =
    url.pathname === "/" && url.searchParams.get("login") === "1";

  const startedAt = Number(window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || 0);
  if (startedAt && Date.now() - startedAt < AUTH_REDIRECT_TTL_MS) return;

  if (alreadyOnLoginPrompt) {
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_REDIRECT_KEY, String(Date.now()));
  window.location.assign("/?login=1");
}

/** Clear session and send the user to the marketing home login prompt. */
export function logoutAndRedirectHome() {
  clearAuth();
  redirectToLoginIfNeeded();
}

/** Codes that mean the stored JWT itself is dead — safe to clearAuth(). */
const CLEAR_SESSION_ERROR_CODES = new Set([
  "TOKEN_NOT_VALID",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "JWT_EXPIRED",
  "JWT_INVALID",
]);

/**
 * True only for definite session death (expired/invalid JWT).
 * Never clear for TOKEN_MISSING — that often means Authorization was omitted
 * during a hard-refresh race, not a bad token.
 * When a Bearer token *was* sent and the API returns 401, treat unauthorized /
 * invalid / expired messages as session death so we redirect home.
 */
function isAuthTokenError(responseStatus: number, data: unknown): boolean {
  if (!data || typeof data !== "object") {
    // Bare 401 with empty body — do not wipe session (could be a proxy blip).
    return false;
  }

  const payload = data as {
    errorCode?: unknown;
    statusText?: unknown;
    message?: unknown;
  };

  const errorCode =
    typeof payload.errorCode === "string" ? payload.errorCode.toUpperCase() : "";
  const statusText =
    typeof payload.statusText === "string"
      ? payload.statusText.toUpperCase()
      : "";
  const message =
    typeof payload.message === "string" ? payload.message.toLowerCase() : "";

  if (errorCode === "TOKEN_MISSING") return false;
  if (CLEAR_SESSION_ERROR_CODES.has(errorCode)) return true;
  if (statusText === "TOKENEXPIREDERROR" || statusText === "JSONWEBTOKENERROR") {
    return true;
  }

  if (responseStatus === 401 || responseStatus === 400) {
    return (
      message.includes("login expired") ||
      message.includes("token expired") ||
      message.includes("token invalid") ||
      message.includes("invalid token") ||
      message.includes("invalid or expired token") ||
      message.includes("jwt expired") ||
      message.includes("jwt malformed") ||
      message.includes("unauthorized") ||
      message.includes("unauthorised")
    );
  }

  return false;
}

export type TokenValidationResult = "valid" | "invalid" | "unknown";

/** Tri-state token check — network/5xx = unknown (do not wipe local session). */
export async function checkStoredToken(): Promise<TokenValidationResult> {
  const auth = getAuth();
  if (!auth?.token) return "invalid";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    let data: { errorCode?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      return "unknown";
    }

    if (data?.errorCode === "TOKEN_VALID") return "valid";
    if (
      data?.errorCode === "TOKEN_NOT_VALID" ||
      data?.errorCode === "TOKEN_EXPIRED" ||
      data?.errorCode === "TOKEN_INVALID"
    ) {
      return "invalid";
    }
    if (response.status >= 500 || data?.errorCode === "SERVER_ERROR") {
      return "unknown";
    }
    // Unexpected shape / network blip — don't destroy the session.
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** @deprecated Prefer checkStoredToken(); true only when explicitly valid. */
export async function validateStoredToken() {
  return (await checkStoredToken()) === "valid";
}

export async function apiRequest<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const auth = getAuth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (auth?.token && isAuthTokenError(response.status, data)) {
    clearAuth();
    redirectToLoginIfNeeded();
  }

  if (data == null || typeof data !== "object") {
    if (response.status === 401 && auth?.token) {
      clearAuth();
      redirectToLoginIfNeeded();
    }
    const lang = getClientAppLanguage();
    throw new Error(translate(lang, "requestFailed", "Request failed"));
  }

  const payload = data as { success?: boolean; message?: unknown };
  if (!response.ok || payload.success === false) {
    const raw = payload.message;
    const lang = getClientAppLanguage();
    const msg =
      typeof raw === "string" && raw.trim()
        ? localizeApiErrorMessage(raw)
        : translate(lang, "requestFailed", "Request failed");

    if (response.status >= 500) {
      void reportError({
        message: msg,
        route: path,
        statusCode: response.status,
      });
    }

    throw new Error(msg);
  }

  return data as T;
}
