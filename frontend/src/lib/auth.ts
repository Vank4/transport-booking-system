"use client";

import config from "@/config";

export const ACCESS_TOKEN_KEY = "accessToken";
export const LEGACY_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_ROLE_KEY = "userRole";

const ACCESS_TOKEN_KEYS = [
  LEGACY_TOKEN_KEY,
  ACCESS_TOKEN_KEY,
  "authToken",
  "access_token",
  "jwt",
  "jwtToken",
];

const REFRESH_TOKEN_KEYS = [REFRESH_TOKEN_KEY, "refresh_token"];

export type UserRole = "USER" | "ADMIN";

function canUseStorage() {
  return typeof window !== "undefined";
}

const isJwtLike = (value: string) =>
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const shouldSkipKey = (key: string, ignoredKeys: string[]) => {
  const normalizedKey = key.toLowerCase();
  return ignoredKeys.some(
    (ignored) =>
      normalizedKey === ignored.toLowerCase() ||
      normalizedKey.includes(ignored.toLowerCase()),
  );
};

const extractToken = (
  value: unknown,
  preferredKeys: string[],
  ignoredKeys: string[],
): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (isJwtLike(trimmed)) return trimmed;

    const parsed = safeJsonParse(trimmed);
    if (parsed !== null) {
      return extractToken(parsed, preferredKeys, ignoredKeys);
    }

    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = extractToken(item, preferredKeys, ignoredKeys);
      if (token) return token;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of preferredKeys) {
      if (key in record && !shouldSkipKey(key, ignoredKeys)) {
        const token = extractToken(record[key], preferredKeys, ignoredKeys);
        if (token) return token;
      }
    }

    for (const [key, nestedValue] of Object.entries(record)) {
      if (shouldSkipKey(key, ignoredKeys)) continue;

      const token = extractToken(nestedValue, preferredKeys, ignoredKeys);
      if (token) return token;
    }
  }

  return null;
};

const readTokenFromStorage = (
  storage: Storage,
  preferredKeys: string[],
  ignoredKeys: string[],
) => {
  for (const key of preferredKeys) {
    const value = storage.getItem(key);
    if (!value) continue;

    const token = extractToken(value, preferredKeys, ignoredKeys);
    if (token) return token;
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || preferredKeys.includes(key) || shouldSkipKey(key, ignoredKeys)) {
      continue;
    }

    const value = storage.getItem(key);
    if (!value) continue;

    const token = extractToken(value, preferredKeys, ignoredKeys);
    if (token) return token;
  }

  return null;
};

const decodeJwtPayload = (token: string) => {
  if (!canUseStorage() || !isJwtLike(token)) return null;

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string, bufferMs = 30_000) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + bufferMs;
};

const persistAccessToken = (token: string) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  // Lưu vào cookie để Next.js Middleware đọc được ở edge
  document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

const persistRefreshToken = (token: string) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getStoredAccessToken = () => {
  if (!canUseStorage()) return null;

  return (
    readTokenFromStorage(window.localStorage, ACCESS_TOKEN_KEYS, REFRESH_TOKEN_KEYS) ??
    readTokenFromStorage(window.sessionStorage, ACCESS_TOKEN_KEYS, REFRESH_TOKEN_KEYS)
  );
};

export const getStoredRefreshToken = () => {
  if (!canUseStorage()) return null;

  return (
    readTokenFromStorage(window.localStorage, REFRESH_TOKEN_KEYS, []) ??
    readTokenFromStorage(window.sessionStorage, REFRESH_TOKEN_KEYS, [])
  );
};

export function getAccessToken(): string | null {
  return getStoredAccessToken();
}

export function getRefreshToken(): string | null {
  return getStoredRefreshToken();
}

export function getStoredUserRole(): UserRole | null {
  if (!canUseStorage()) return null;

  const role =
    window.localStorage.getItem(USER_ROLE_KEY) ??
    window.sessionStorage.getItem(USER_ROLE_KEY);

  return role === "ADMIN" || role === "USER" ? role : null;
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredAccessToken());
}

export function canAccessRole(requiredRoles?: UserRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return isAuthenticated();
  const role = getStoredUserRole();
  return Boolean(role && requiredRoles.includes(role));
}

export function persistAuthSession({
  accessToken,
  refreshToken,
  role,
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
  role?: UserRole | null;
}) {
  if (!canUseStorage()) return;

  if (accessToken) {
    persistAccessToken(accessToken);
  }

  if (refreshToken) {
    persistRefreshToken(refreshToken);
  }

  if (role) {
    window.localStorage.setItem(USER_ROLE_KEY, role);
    window.sessionStorage.setItem(USER_ROLE_KEY, role);
    // Lưu role vào cookie để Middleware đọc được
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) return;

  const keys = new Set([
    ...ACCESS_TOKEN_KEYS,
    ...REFRESH_TOKEN_KEYS,
    USER_ROLE_KEY,
  ]);

  for (const key of keys) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }

  // Xóa cookie khi logout
  document.cookie = 'accessToken=; path=/; max-age=0';
  document.cookie = 'token=; path=/; max-age=0';
  document.cookie = 'userRole=; path=/; max-age=0';
}

export function buildLoginRedirect(targetPath: string): string {
  const params = new URLSearchParams({ redirect: targetPath });
  return `/auth/login?${params.toString()}`;
}

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(`${config.apiBaseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) return null;

  const nextAccessToken = extractToken(
    payload,
    ACCESS_TOKEN_KEYS,
    REFRESH_TOKEN_KEYS,
  );
  if (!nextAccessToken) return null;

  persistAuthSession({
    accessToken: nextAccessToken,
    refreshToken,
  });

  return nextAccessToken;
};

export const getValidAccessToken = async () => {
  const accessToken = getStoredAccessToken();
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return accessToken && !isTokenExpired(accessToken) ? accessToken : null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  const refreshedToken = await refreshPromise;
  if (refreshedToken) return refreshedToken;

  return accessToken && !isTokenExpired(accessToken) ? accessToken : null;
};
