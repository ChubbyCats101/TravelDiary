import type { Session } from '../types/event';
import { isTrip, type Trip, type TripDraft } from '../types/trip';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiUrl } from './api-config';
export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri, Platform.OS);
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  if (!/^https?:\/\//.test(API_URL)) throw new Error('ตั้ง EXPO_PUBLIC_API_URL เป็น URL ของ API ที่ขึ้นต้นด้วย http:// หรือ https://');
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) timeout.abort();
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, signal: timeout.signal, headers: { 'Content-Type': 'application/json', ...options.headers } });
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new Error('API ส่งข้อมูลที่ไม่ใช่ JSON'); }
    if (!response.ok) throw new ApiError(response.status, payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `API error ${response.status}`);
    return payload;
  } catch (error) {
    if (timeout.signal.aborted && !options.signal?.aborted) throw new Error('เชื่อมต่อเกิน 12 วินาที กรุณาลองใหม่');
    throw error;
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
}
export function isSession(data: unknown): data is Session {
  if (!data || typeof data !== 'object') return false;
  const s = data as Session;
  return typeof s.token === 'string' && /^[a-f0-9]{64}$/.test(s.token) && typeof s.email === 'string' && Number.isFinite(s.expiresAt);
}
export async function authenticate(email: string, password: string, create: boolean): Promise<Session> {
  const data = await request(create ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!isSession(data)) throw new Error('ข้อมูลเซสชันไม่ถูกต้อง');
  return data;
}
export async function revokeSession(token: string) { await request('/auth/logout', { method: 'POST', body: '{}', headers: { Authorization: `Bearer ${token}` } }); }
export async function verifySession(token: string) { await request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }); }
export async function listTrips(token: string, signal?: AbortSignal): Promise<Trip[]> {
  const data = await request('/trips', { signal, headers: { Authorization: 'Bearer ' + token } });
  if (!Array.isArray(data) || !data.every(isTrip)) throw new Error('ข้อมูลทริปไม่ถูกต้อง');
  return data;
}
export async function saveTrip(draft: TripDraft, token: string): Promise<Trip> {
  const data = await request('/trips/' + encodeURIComponent(draft.id), { method: 'PUT', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(draft) });
  if (!isTrip(data)) throw new Error('ข้อมูลทริปไม่ถูกต้อง'); return data;
}
export async function deleteTrip(id: string, token: string) {
  await request('/trips/' + encodeURIComponent(id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
}
export type UserProfile = { name: string; bio: string; photo: string | null };
function profileResponse(data: unknown): UserProfile {
  const p = data as UserProfile | null;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || typeof p.bio !== 'string' || p.bio.length > 300 || !(p.photo === null || (typeof p.photo === 'string' && p.photo.length <= 700_000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p.photo)))) throw new Error('ข้อมูลโปรไฟล์ไม่ถูกต้อง');
  return p;
}
export async function getProfile(token: string, signal?: AbortSignal): Promise<UserProfile> {
  return profileResponse(await request('/profile', { signal, headers: { Authorization: `Bearer ${token}` } }));
}
export async function saveProfile(profile: UserProfile, token: string): Promise<UserProfile> {
  return profileResponse(await request('/profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(profile) }));
}
