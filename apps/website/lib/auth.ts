import { AUTH_STORAGE_KEY, authAtom, authStore, StoredAuth } from "@/lib/authAtom";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";

type RegisterPayload = {
  mobile: string;
  countryCode: string;
  locale: string;
};

type LoginPayload = {
  mobile: string;
  otp?: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Registration failed");
  }

  return data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
}

export function saveAuth(data: StoredAuth) {
  authStore.set(authAtom, data);
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
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

function redirectToLoginIfNeeded() {
  if (typeof window === "undefined") return;
  window.location.href = "/?login=1";
}

function isAuthTokenError(responseStatus: number, data: unknown): boolean {
  if (responseStatus === 401) return true;
  if (!data || typeof data !== "object") return false;

  const payload = data as {
    errorCode?: unknown;
    message?: unknown;
  };

  const errorCode = typeof payload.errorCode === "string" ? payload.errorCode.toUpperCase() : "";
  const message = typeof payload.message === "string" ? payload.message.toLowerCase() : "";

  return (
    errorCode.includes("TOKEN") ||
    message.includes("token expired") ||
    message.includes("token invalid") ||
    message.includes("invalid token") ||
    message.includes("jwt expired") ||
    message.includes("unauthorized")
  );
}

export async function validateStoredToken() {
  const auth = getAuth();
  if (!auth?.token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    const data = await response.json();
    return data?.errorCode === "TOKEN_VALID";
  } catch {
    return false;
  }
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

  const data = await response.json();
  if (isAuthTokenError(response.status, data)) {
    redirectToLoginIfNeeded();
  }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}
