import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from './local-notifications';
import type { PlannedNotification } from './notification-plan';

const prefix = 'traveldiary:';
const channelId = 'travel-diary';
const customChannel = Platform.OS === 'android' && Constants.appOwnership !== 'expo';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function allowNotifications() {
  if (Platform.OS === 'web') throw new Error('การแจ้งเตือนนี้ใช้บน Android และ iOS');
  if (customChannel) await Notifications.setNotificationChannelAsync(channelId, { name: 'บันทึกและความทรงจำ', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('ยังไม่ได้รับสิทธิ์แจ้งเตือน กรุณาเปิดสิทธิ์ในการตั้งค่ามือถือ');
}
let queue: Promise<unknown> = Promise.resolve();
export function syncNotifications(owner: string | null, plan: PlannedNotification[] | null, current: () => boolean = () => true) {
  const job = queue.catch(() => {}).then(async () => {
    if (Platform.OS === 'web' || !current()) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const desired = new Map((plan ?? []).map(item => [`${prefix}${owner}:${item.id}`, item]));
    for (const notification of scheduled) {
      if (!current()) return;
      if (!notification.identifier.startsWith(prefix)) continue;
      if (owner && notification.content.data?.owner === owner && (plan === null || notification.identifier === `${prefix}${owner}:test`)) continue;
      const item = desired.get(notification.identifier);
      const signature = item && JSON.stringify(item);
      if (item && signature === notification.content.data?.signature) desired.delete(notification.identifier);
      else await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    if (!owner || !current()) return;
    if (plan?.length && !(await Notifications.getPermissionsAsync()).granted) throw new Error('การแจ้งเตือนถูกปิดในการตั้งค่ามือถือ');
    for (const [identifier, item] of desired) {
      if (!current()) return;
      if (item.at <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({ identifier,
        content: { title: item.title, body: item.body, sound: 'default', data: { owner, kind: item.kind, day: item.day ?? '', signature: JSON.stringify(item) } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), ...(customChannel ? { channelId } : {}) } });
    }
  });
  queue = job;
  return job;
}
