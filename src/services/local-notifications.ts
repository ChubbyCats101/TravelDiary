// SDK 57's package entry initializes remote push registration, which throws in
// Android Expo Go. Import only local notification APIs; check these paths on SDK upgrades.
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { requestPermissionsAsync, getPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes, type NotificationResponse } from 'expo-notifications/build/Notifications.types';
export {
  DEFAULT_ACTION_IDENTIFIER,
  getLastNotificationResponse,
  clearLastNotificationResponseAsync,
  addNotificationResponseReceivedListener,
} from 'expo-notifications/build/NotificationsEmitter';
