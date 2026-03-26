"use client";

export const ACCESS_TOKEN_KEY = "accessToken";
export const LEGACY_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_ROLE_KEY = "userRole";

export type UserRole = "USER" | "ADMIN";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUserRole(): UserRole | null {
  if (!canUseStorage()) return null;
  const role = localStorage.getItem(USER_ROLE_KEY);
  return role === "ADMIN" || role === "USER" ? role : null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
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
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (role) {
    localStorage.setItem(USER_ROLE_KEY, role);
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

export function buildLoginRedirect(targetPath: string): string {
  const params = new URLSearchParams({ redirect: targetPath });
  return `/auth/login?${params.toString()}`;
}
