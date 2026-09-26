import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authenticate, isSession, revokeSession, verifySession, ApiError } from '../services/api';
import type { Session } from '../types/event';
const KEY = 'traveldiary-session';
type Auth = { session: Session | null; ready: boolean; error: string; signIn: (email: string, password: string, create: boolean) => Promise<void>; signOut: () => Promise<void>; expire: () => Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const expire = useCallback(async () => {
    setSession(null);
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(KEY);
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const raw = await SecureStore.getItemAsync(KEY);
          const saved: unknown = raw ? JSON.parse(raw) : null;
          if (isSession(saved) && saved.expiresAt > Date.now()) {
            try { await verifySession(saved.token); } catch (e) { if (e instanceof ApiError && e.status === 401) { await SecureStore.deleteItemAsync(KEY); return; } }
            if (active) setSession(saved);
          } else if (raw) await SecureStore.deleteItemAsync(KEY);
        }
      } catch { if (active) setError('อ่านเซสชันไม่ได้ กรุณาเข้าสู่ระบบใหม่'); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!session) return;
    const check = () => { if (Date.now() >= session.expiresAt) void expire().catch(() => setError('ลบเซสชันไม่ได้ กรุณาลองออกจากระบบอีกครั้ง')); };
    const timer = setTimeout(check, Math.max(0, session.expiresAt - Date.now()));
    const sub = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { clearTimeout(timer); sub.remove(); };
  }, [session, expire]);
  async function signIn(email: string, password: string, create: boolean) {
    const next = await authenticate(email, password, create);
    if (Platform.OS !== 'web') await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    setSession(next); setError('');
  }
  async function signOut() {
    const current = session;
    await expire();
    if (current) {
      try { await revokeSession(current.token); } catch { setError('ออกจากระบบบนเครื่องแล้ว แต่ติดต่อเซิร์ฟเวอร์ไม่ได้ เซสชันฝั่งเซิร์ฟเวอร์จะหมดอายุตามเวลา'); }
    }
  }
  return <Context.Provider value={{ session, ready, error, signIn, signOut, expire }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider missing'); return value; }
