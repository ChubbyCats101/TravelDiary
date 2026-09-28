import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRootNavigationState } from 'expo-router';
import { useAuth } from './AuthContext';
import { useTrips } from './TripsContext';
import { defaultSettings, memoryTrips, notificationPlan, type NotificationSettings } from '../services/notification-plan';
import { allowNotifications, syncNotifications } from '../services/diary-notifications';
import * as Notifications from '../services/local-notifications';

type State = { settings: NotificationSettings; ready: boolean; error: string; update: (settings: NotificationSettings) => Promise<void>; test: (memory?: boolean) => Promise<void>; retry: () => void };
const Context = createContext<State | null>(null);
const key = (owner: string) => `@traveldiary/notifications/${owner}`;
export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session, ready: authReady } = useAuth();
  const { trips, loaded } = useTrips();
  const owner = session?.email ?? null;
  const navigation = useRootNavigationState();
  const [stored, setStored] = useState<{ owner: string; settings: NotificationSettings } | null>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState<Notifications.NotificationResponse | null>(null);
  const active = useRef(owner);
  useLayoutEffect(() => { active.current = owner; }, [owner]);
  const settings = stored?.owner === owner ? stored.settings : defaultSettings;
  const ready = !!owner && stored?.owner === owner;
  useEffect(() => {
    if (!owner) return;
    let live = true;
    AsyncStorage.getItem(key(owner)).then(raw => {
      const value = raw ? JSON.parse(raw) : defaultSettings;
      if (!Array.isArray(value.reminders) || typeof value.memories !== 'boolean' || !Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23 || !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59 || value.reminders.length > 20 || value.reminders.some((r: { id?: unknown; title?: unknown; at?: unknown }) => !r || typeof r.id !== 'string' || typeof r.title !== 'string' || !r.title.trim() || r.title.length > 100 || typeof r.at !== 'number' || !Number.isFinite(r.at))) throw new Error('ข้อมูลการแจ้งเตือนในเครื่องไม่ถูกต้อง');
      if (live) { setStored({ owner, settings: value }); setLoadError(''); }
    }).catch(e => { if (live) setLoadError(e instanceof Error ? e.message : 'อ่านการตั้งค่าไม่ได้'); });
    return () => { live = false; };
  }, [owner, revision]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state === 'active') setRevision(v => v + 1); });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!authReady) return;
    let live = true;
    void syncNotifications(owner, owner ? (ready && loaded ? notificationPlan(settings, trips) : null) : [], () => live && active.current === owner)
      .then(() => { if (live) setError(''); }).catch(e => { if (live) setError(`ตั้งการแจ้งเตือนไม่สำเร็จ: ${e instanceof Error ? e.message : 'กรุณาลองใหม่'}`); });
    return () => { live = false; };
  }, [authReady, owner, ready, loaded, settings, trips, revision]);
  useEffect(() => {
    // Read the native response once, including when a notification launched the app.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(setPending);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!pending || !navigation?.key || !authReady || !owner || !loaded) return;
    const data = pending.notification.request.content.data ?? {};
    if (data.owner === owner && pending.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      if (data.kind === 'write') router.push('/(tabs)/add');
      else if (data.kind === 'memory' && typeof data.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.day)) {
        const matches = memoryTrips(trips, data.day);
        if (matches.length === 1) router.push({ pathname: '/trip/[id]', params: { id: matches[0].id } });
        else router.push({ pathname: '/memories', params: { day: data.day } });
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [pending, navigation?.key, authReady, owner, loaded, trips]);
  async function update(next: NotificationSettings) {
    if (!owner || !ready || !loaded) throw new Error('รอโหลดข้อมูลบัญชีและบันทึกก่อน');
    if (next.reminders.length > 20) throw new Error('ตั้งเตือนได้สูงสุด 20 รายการ กรุณาลบรายการเดิมก่อน');
    if ((!settings.memories && next.memories) || next.reminders.some(r => r.at > Date.now() && !settings.reminders.some(old => old.id === r.id && old.at === r.at && old.title === r.title))) await allowNotifications();
    if (active.current !== owner) throw new Error('บัญชีเปลี่ยนแล้ว กรุณาลองใหม่');
    try {
      await syncNotifications(owner, notificationPlan(next, trips), () => active.current === owner);
      if (active.current !== owner) throw new Error('บัญชีเปลี่ยนแล้ว กรุณาลองใหม่');
      await AsyncStorage.setItem(key(owner), JSON.stringify(next));
      if (active.current === owner) setStored({ owner, settings: next });
    } catch (e) {
      // Preserve the previous intent on failure, including a failed storage write.
      await syncNotifications(owner, notificationPlan(settings, trips), () => active.current === owner).catch(() => {});
      throw e;
    }
  }
  async function test(memory = false) {
    if (!owner || !ready || !loaded) throw new Error('รอโหลดข้อมูลก่อน');
    const sample = memory ? notificationPlan({ ...settings, memories: true }, trips).find(p => p.kind === 'memory') : undefined;
    if (memory && !sample) throw new Error('เพิ่มบันทึกการเดินทางก่อน จึงจะทดสอบย้อนความทรงจำได้');
    await allowNotifications();
    await syncNotifications(owner, [...notificationPlan(settings, trips), { ...(sample ?? { title: '📔 ทดสอบเตือนเขียนบันทึก', body: 'แตะเพื่อเพิ่มบันทึกการเดินทาง', kind: 'write' as const }), id: 'test', at: Date.now() + 3000 }], () => active.current === owner);
  }
  return <Context.Provider value={{ settings, ready: ready && loaded, error: loadError || error, update, test, retry: () => setRevision(v => v + 1) }}>{children}</Context.Provider>;
}
export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error('NotificationsProvider missing');
  return value;
}
