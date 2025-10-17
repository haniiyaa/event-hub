import { getApiBaseUrl } from "./config";
import type { ApiErrorPayload } from "./types";

export class ApiError extends Error {
  status: number;
  details?: string[];
  path?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message || payload.error || "Unexpected API error");
    this.name = "ApiError";
    this.status = payload.status;
    this.details = payload.details;
    this.path = payload.path;
  }
}

interface RequestOptions extends RequestInit {
  searchParams?: Record<string, string | number | undefined | null>;
  skipAuth?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = new URL(endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`);

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const requestInit: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    credentials: options.skipAuth ? options.credentials : "include",
  };

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    const payload = (await safeJson(response)) as ApiErrorPayload | undefined;
    if (payload && payload.status) {
      throw new ApiError(payload);
    }
    throw new ApiError({
      status: response.status,
      error: response.statusText,
      message: payload?.message || "Request failed",
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await safeJson(response)) as T;
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
