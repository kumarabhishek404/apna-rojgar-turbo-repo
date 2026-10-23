import { getApiBaseUrl } from "@/constants/api";

let memoryToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setMemoryToken(token: string | null) {
  memoryToken = token;
}

export function getMemoryToken() {
  return memoryToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token === undefined ? memoryToken : options.token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check the connection and try again.", 0);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: T;
  } & T;

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(payload.message || "Session expired. Sign in again.", 401);
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || "Request failed", response.status);
  }

  return payload;
}
