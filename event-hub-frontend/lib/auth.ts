"use client";

import { apiFetch } from "./api-client";
import type { UserSummary } from "./types";

export interface SessionState {
  user: UserSummary | null;
  loading: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  classDetails: string;
}

interface LoginResponse {
  message: string;
  username: string;
  role: UserSummary["role"];
  fullName: string;
}

export async function login(payload: LoginPayload): Promise<UserSummary> {
  const response = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const profile = await getCurrentUser();

  if (!profile) {
    return {
      id: 0,
      username: response.username,
      email: "",
      fullName: response.fullName,
      role: response.role,
    };
  }

  saveSession(profile);
  return profile;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  try {
    const data = await apiFetch<UserSummary>("/api/auth/me", {
      method: "GET",
    });
    saveSession(data);
    return data;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors during logout
  }
  clearSession();
}

const STORAGE_KEY = "event-hub-session";

export function loadSession(): UserSummary | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSummary;
  } catch {
    return null;
  }
}

function saveSession(user: UserSummary) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
