const DEFAULT_API_BASE = "http://localhost:8080";

export function getApiBaseUrl() {
  if (typeof process === "undefined") {
    return DEFAULT_API_BASE;
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv : DEFAULT_API_BASE;
}
