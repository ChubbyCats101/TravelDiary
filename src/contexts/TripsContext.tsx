import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import { ApiError, listTrips, saveTrip, deleteTrip } from '../services/api';
import type { Trip, TripDraft } from '../types/trip';
type State = { trips: Trip[]; loaded: boolean; loading: boolean; error: string; refresh: () => Promise<void>; save: (draft: TripDraft) => Promise<void>; remove: (id: string) => Promise<void> };
const Context = createContext<State | null>(null);
export function TripsProvider({ children }: PropsWithChildren) {
  const { session, expire } = useAuth();
  const [loadedToken, setLoadedToken] = useState<string | null>(null); const [trips, setTrips] = useState<Trip[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const loaded = !!session && loadedToken === session.token;
  const activeToken = useRef(session?.token);
  useLayoutEffect(() => {
    activeToken.current = session?.token;
    return () => { activeToken.current = undefined; };
  }, [session?.token]);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort(); if (!session) return;
    const token = session.token; const next = new AbortController(); request.current = next;
    setLoading(true); setError('');
    try { const data = await listTrips(token, next.signal); if (!next.signal.aborted && activeToken.current === token) { setTrips(data); setLoadedToken(token); } }
    catch (e) { if (!next.signal.aborted && activeToken.current === token) { setError(e instanceof Error ? e.message : 'โหลดบันทึกไม่ได้'); if (e instanceof ApiError && e.status === 401) void expire(); } }
    finally { if (!next.signal.aborted && activeToken.current === token) setLoading(false); }
  }, [session, expire]);
  useEffect(() => {
    // Clear the previous account's private data even when the next request fails.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrips([]); setLoadedToken(null); setError(''); setLoading(false);
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);
  async function save(draft: TripDraft) {
    if (!session) throw new Error('กรุณาเข้าสู่ระบบ');
    const token = session.token; request.current?.abort(); setLoading(false);
    try {
      const trip = await saveTrip(draft, token);
      if (activeToken.current === token) setTrips(current => [trip, ...current.filter(t => t.id !== trip.id)].sort((a,b) => b.date.localeCompare(a.date)));
    } catch (e) {
      if (activeToken.current === token && e instanceof ApiError && e.status === 401) await expire();
      throw e;
    }
  }
  async function remove(id: string) {
    if (!session) throw new Error('กรุณาเข้าสู่ระบบ');
    const token = session.token; request.current?.abort(); setLoading(false);
    try {
      await deleteTrip(id, token);
      if (activeToken.current === token) setTrips(current => current.filter(t => t.id !== id));
    } catch (e) {
      if (activeToken.current === token && e instanceof ApiError && e.status === 401) await expire();
      throw e;
    }
  }
  return <Context.Provider value={{ trips, loaded, loading, error, refresh, save, remove }}>{children}</Context.Provider>;
}
export function useTrips() { const state = useContext(Context); if (!state) throw new Error('TripsProvider missing'); return state; }
