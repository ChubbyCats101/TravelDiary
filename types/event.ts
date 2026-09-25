// Shared device and session types retained from the original application.
export type Venue = { name: string; latitude: number; longitude: number };
export type Session = { token: string; expiresAt: number; email: string };
export function isVenue(value: unknown): value is Venue {
  if (!value || typeof value !== 'object') return false;
  const v=value as Venue;
  return typeof v.name==='string' && !!v.name.trim() && v.name.length<=200 && Number.isFinite(v.latitude) && Math.abs(v.latitude)<=90 && Number.isFinite(v.longitude) && Math.abs(v.longitude)<=180;
}
