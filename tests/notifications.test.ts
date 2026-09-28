import { notificationPlan, memoryTrips, defaultSettings } from '../src/services/notification-plan';
import { trip } from './fixtures';
import { allowNotifications, syncNotifications } from '../src/services/diary-notifications';
import * as native from '../src/services/local-notifications';

jest.mock('../src/services/local-notifications', () => ({
  setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(), getPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(), cancelScheduledNotificationAsync: jest.fn(), scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 }, SchedulableTriggerInputTypes: { DATE: 'date' },
}));
beforeEach(() => {
  jest.mocked(native.getAllScheduledNotificationsAsync).mockResolvedValue([]);
  jest.mocked(native.getPermissionsAsync).mockResolvedValue({ granted: true } as never);
});
it('groups anniversaries by travel date, excludes future trips and skips non-leap years', () => {
  const trips = [{ ...trip, date: '2020-02-29' }, { ...trip, id: 'second', date: '2024-02-29' }, { ...trip, id: 'future', date: '2030-02-28' }];
  const plan = notificationPlan({ ...defaultSettings, memories: true }, trips, new Date(2026, 0, 1));
  expect(plan).toHaveLength(1);
  expect(plan[0].day).toBe('2028-02-29');
  expect(plan[0].title).toContain('2');
  expect(new Date(plan[0].at).getHours()).toBe(9);
  expect(memoryTrips(trips, '2028-02-29')).toHaveLength(2);
});
it('does not notify on the original trip day and retains all one-off reminders within the capacity', () => {
  const now = new Date(2026, 8, 24, 8);
  const reminders = Array.from({ length: 20 }, (_, i) => ({ id: `r${i}`, at: now.getTime() + (i + 1) * 100000, title: 'เขียนบันทึก' }));
  const trips = Array.from({ length: 28 }, (_, i) => ({ ...trip, id: `${i}`, date: `2020-10-${String(i + 1).padStart(2, '0')}` }));
  const plan = notificationPlan({ ...defaultSettings, reminders, memories: true }, trips, now);
  expect(plan).toHaveLength(59);
  expect(plan.filter(p => p.kind === 'write')).toHaveLength(20);
  expect(notificationPlan({ ...defaultSettings, memories: true }, [trip], now)[0].day).toBe('2027-09-24');
  expect(notificationPlan({ ...defaultSettings, reminders: [{ id: 'old', at: 1, title: 'expired' }] }, [], now)).toEqual([]);
});
it('rejects denied permissions', async () => {
  jest.mocked(native.requestPermissionsAsync).mockResolvedValue({ granted: false } as never);
  await expect(allowNotifications()).rejects.toThrow('สิทธิ์');
});
it('keeps unchanged notifications, removes deleted and foreign items, and schedules edits', async () => {
  const item = { id: 'r1', at: Date.now() + 60000, title: 'เตือน', body: 'บันทึก', kind: 'write' as const };
  jest.mocked(native.getAllScheduledNotificationsAsync).mockResolvedValue([
    { identifier: 'traveldiary:me:r1', content: { data: { owner: 'me', signature: JSON.stringify(item) } } },
    { identifier: 'traveldiary:me:deleted', content: { data: { owner: 'me' } } },
    { identifier: 'traveldiary:other:r2', content: { data: { owner: 'other' } } },
    { identifier: 'unrelated', content: { data: {} } },
  ] as never);
  await syncNotifications('me', [item]);
  expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(native.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  await syncNotifications('me', [{ ...item, title: 'แก้ไข' }]);
  expect(native.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ identifier: 'traveldiary:me:r1', content: expect.objectContaining({ title: 'แก้ไข' }) }));
});
it('cleans up old accounts even while new trips are loading and stops stale jobs', async () => {
  jest.mocked(native.getAllScheduledNotificationsAsync).mockResolvedValue([
    { identifier: 'traveldiary:old:r', content: { data: { owner: 'old' } } },
    { identifier: 'traveldiary:new:r', content: { data: { owner: 'new' } } },
  ] as never);
  await syncNotifications('new', null);
  expect(native.cancelScheduledNotificationAsync).toHaveBeenCalledWith('traveldiary:old:r');
  expect(native.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('traveldiary:new:r');
  jest.mocked(native.cancelScheduledNotificationAsync).mockClear();
  await syncNotifications(null, [], () => false);
  expect(native.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  await syncNotifications(null, []);
  expect(native.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
});
