import type { Trip } from '../types/trip';

export type Reminder = { id: string; title: string; at: number };
export type NotificationSettings = { reminders: Reminder[]; memories: boolean; hour: number; minute: number };
export const defaultSettings: NotificationSettings = { reminders: [], memories: false, hour: 9, minute: 0 };
export type PlannedNotification = { id: string; at: number; title: string; body: string; kind: 'write' | 'memory'; day?: string };
export function memoryTrips(trips: Trip[], day: string) {
  return trips.filter(t => t.date.slice(5) === day.slice(5) && t.date < day && t.date.slice(0, 4) < day.slice(0, 4));
}
export function notificationPlan(settings: NotificationSettings, trips: Trip[], now = new Date()): PlannedNotification[] {
  const reminders: PlannedNotification[] = settings.reminders.filter(r => r.at > now.getTime()).map(r => ({ ...r, kind: 'write', body: 'เก็บเรื่องราวการเดินทางของคุณไว้ใน TravelDiary' }));
  if (!settings.memories) return reminders;
  const groups = new Map<string, Trip[]>();
  // Schedule concrete dates so future trips never become premature memories.
  // ponytail: keep 59 scheduled items plus one test; refill on launch, foreground, and edits.
  for (let year = now.getFullYear(); year <= now.getFullYear() + 4; year++) {
    for (const trip of trips) {
      if (year <= Number(trip.date.slice(0, 4))) continue;
      const month = Number(trip.date.slice(5, 7)), day = Number(trip.date.slice(8, 10));
      const date = new Date(year, month - 1, day, settings.hour, settings.minute);
      if (date.getMonth() !== month - 1 || date.getDate() !== day || date <= now) continue;
      const key = `${year}-${trip.date.slice(5)}`;
      groups.set(key, [...(groups.get(key) ?? []), trip]);
    }
  }
  const memories: PlannedNotification[] = [...groups].map(([day, items]): PlannedNotification => {
    const [year, month, date] = day.split('-').map(Number);
    return { id: `memory-${day}`, at: new Date(year, month - 1, date, settings.hour, settings.minute).getTime(), kind: 'memory', day,
      title: items.length === 1 ? '🌄 ย้อนความทรงจำการเดินทาง' : `🌄 วันนี้มี ${items.length} ความทรงจำให้ย้อนดู`,
      body: items.length === 1 ? `วันนี้เมื่อ ${year - Number(items[0].date.slice(0, 4))} ปีที่แล้ว: ${items[0].title}` : 'แตะเพื่อเปิดบันทึกของวันนี้ในปีก่อน ๆ' };
  }).sort((a, b) => a.at - b.at);
  return [...reminders, ...memories.slice(0, Math.max(0, 59 - reminders.length))].sort((a, b) => a.at - b.at);
}
