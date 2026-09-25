import type { Session } from '../types/event';
import type { Trip } from '../types/trip';

export const session: Session = {
  token: 'a'.repeat(64), email: 'student@example.test', expiresAt: Date.now() + 3600000,
};
export const trip: Trip = {
  id: 'trip-test', title: 'เชียงใหม่', date: '2026-09-24', note: 'วันหยุด',
  location: { name: 'ดอยสุเทพ', latitude: 18.8, longitude: 98.9 },
  photo: null, favorite: false, createdAt: '2026-09-24', updatedAt: '2026-09-24',
};
