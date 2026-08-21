// lib/auth.ts

export interface AuthUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  avatar?: string;
}

const TOKEN_KEY = "crm_auth_token";
const USER_KEY = "crm_auth_user";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function saveUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getUser(): AuthUser | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as AuthUser;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Merges fields into the cached user without a round-trip — used after an avatar
 * upload so every mounted avatar picks the new URL up.
 */
export function updateUser(patch: Partial<AuthUser>): AuthUser | null {
  const current = getUser();
  if (!current) return null;

  const next = { ...current, ...patch };
  saveUser(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("crm:user-updated", { detail: next }));
  }

  return next;
}
