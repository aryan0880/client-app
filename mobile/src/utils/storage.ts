import { Preferences } from '@capacitor/preferences';
import type { UserProfile } from '../types';

const KEYS = {
  TOKEN: 'foodscan:auth:token',
  USER: 'foodscan:auth:user',
} as const;

const isNativeCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return typeof w?.Capacitor?.isNativePlatform === 'function' && w.Capacitor.isNativePlatform();
};

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      if (isNativeCapacitor()) {
        const { value } = await Preferences.get({ key: KEYS.TOKEN });
        return value || null;
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(KEYS.TOKEN);
      }
    } catch (e) {
      console.warn('[storage] getToken failed:', e);
    }
    return null;
  },

  async setToken(token: string | null): Promise<void> {
    try {
      if (isNativeCapacitor()) {
        if (token) await Preferences.set({ key: KEYS.TOKEN, value: token });
        else await Preferences.remove({ key: KEYS.TOKEN });
        return;
      }
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem(KEYS.TOKEN, token);
        else localStorage.removeItem(KEYS.TOKEN);
      }
    } catch (e) {
      console.warn('[storage] setToken failed:', e);
    }
  },

  async getUser(): Promise<UserProfile | null> {
    try {
      let raw: string | null = null;
      if (isNativeCapacitor()) {
        const { value } = await Preferences.get({ key: KEYS.USER });
        raw = value || null;
      } else if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(KEYS.USER);
      }
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch (e) {
      console.warn('[storage] getUser failed:', e);
      return null;
    }
  },

  async setUser(user: UserProfile | null): Promise<void> {
    try {
      const raw = user ? JSON.stringify(user) : null;
      if (isNativeCapacitor()) {
        if (raw) await Preferences.set({ key: KEYS.USER, value: raw });
        else await Preferences.remove({ key: KEYS.USER });
        return;
      }
      if (typeof localStorage !== 'undefined') {
        if (raw) localStorage.setItem(KEYS.USER, raw);
        else localStorage.removeItem(KEYS.USER);
      }
    } catch (e) {
      console.warn('[storage] setUser failed:', e);
    }
  },

  async clearAuth(): Promise<void> {
    await Promise.all([this.setToken(null), this.setUser(null)]);
  },
};
