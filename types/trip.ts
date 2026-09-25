import type { Venue } from './event';
export type TripDraft = { id: string; title: string; date: string; note: string; location: Venue; photo: string | null; favorite: boolean };
export type Trip = TripDraft & { createdAt: string; updatedAt: string };
export function tripErrors(d: TripDraft) {
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isFinite(Date.parse(d.date)) && new Date(d.date).toISOString().slice(0, 10) === d.date;
  return {
    title: !d.title.trim() || d.title.length > 100 ? 'ใส่ชื่อทริป 1–100 ตัวอักษร' : '',
    date: validDate ? '' : 'กรอกวันที่จริง เช่น 2026-09-24 (ค.ศ.)',
    note: d.note.length > 4000 ? 'เขียนความทรงจำได้ไม่เกิน 4,000 ตัวอักษร' : '',
    location: !d.location.name.trim() || d.location.name.length > 200 || !Number.isFinite(d.location.latitude) || Math.abs(d.location.latitude) > 90 || !Number.isFinite(d.location.longitude) || Math.abs(d.location.longitude) > 180 ? 'ใส่สถานที่และพิกัดที่ถูกต้อง ละติจูด −90 ถึง 90 ลองจิจูด −180 ถึง 180' : '',
  };
}
export function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false;
  const t = value as Trip;
  return typeof t.id === 'string' && typeof t.title === 'string' && typeof t.date === 'string' && typeof t.note === 'string' && typeof t.favorite === 'boolean' &&
    (t.photo === null || typeof t.photo === 'string') && !!t.location && typeof t.location.name === 'string' &&
    Number.isFinite(t.location.latitude) && Number.isFinite(t.location.longitude) && typeof t.createdAt === 'string' && typeof t.updatedAt === 'string' && !Object.values(tripErrors(t)).some(Boolean);
}
