import type { FollowerOrder, UserProfile } from './types';

const SESSION_STORAGE_KEY = 'talab_alfolous_session_v1';
const ORDERS_STORAGE_PREFIX = 'talab_alfolous_orders_v1_';

export function loadUserSession(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed?.fullName || !parsed?.normalizedPhone) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserSession(user: UserProfile): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function clearUserSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors gracefully
  }
}

export function loadOrdersForUser(normalizedPhone: string): FollowerOrder[] {
  try {
    const raw = window.localStorage.getItem(
      `${ORDERS_STORAGE_PREFIX}${normalizedPhone}`
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FollowerOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrdersForUser(
  normalizedPhone: string,
  orders: FollowerOrder[]
): void {
  try {
    window.localStorage.setItem(
      `${ORDERS_STORAGE_PREFIX}${normalizedPhone}`,
      JSON.stringify(orders)
    );
  } catch {
    // Ignore storage quota errors gracefully
  }
}
