import { act, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { NotificationsProvider, useNotifications } from '../src/contexts/NotificationsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncNotifications } from '../src/services/diary-notifications';
import { defaultSettings } from '../src/services/notification-plan';
import { trip, session } from './fixtures';
import * as native from '../src/services/local-notifications';
import type { NotificationResponse } from '../src/services/local-notifications';

let mockSession: typeof session | null = session;
let mockTrips = [trip];
jest.mock('../src/contexts/AuthContext', () => ({ useAuth: () => ({ session: mockSession, ready: true }) }));
jest.mock('../src/contexts/TripsContext', () => ({ useTrips: () => ({ trips: mockTrips, loaded: true }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useRootNavigationState: () => ({ key: 'root' }) }));
jest.mock('../src/services/diary-notifications', () => ({ allowNotifications: jest.fn(), syncNotifications: jest.fn(async () => {}) }));
jest.mock('../src/services/local-notifications', () => ({ getLastNotificationResponse: jest.fn(), addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), clearLastNotificationResponseAsync: jest.fn(async () => {}), DEFAULT_ACTION_IDENTIFIER: 'default' }));

function response(kind: string, owner = session.email) {
  return { actionIdentifier: 'default', notification: { request: { identifier: 'sample', content: { data: { kind, owner, day: '2027-09-24' } } } } } as unknown as NotificationResponse;
}
beforeEach(() => { mockSession = session; mockTrips = [trip]; });
it('waits for sign-in then opens the add screen for the same account', async () => {
  mockSession = null;
  jest.mocked(native.getLastNotificationResponse).mockReturnValue(response('write'));
  const view = await render(<NotificationsProvider>{null}</NotificationsProvider>);
  expect(router.push).not.toHaveBeenCalled();
  mockSession = session;
  await view.rerender(<NotificationsProvider>{null}</NotificationsProvider>);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/(tabs)/add'));
});
it('opens one memory directly and a grouped memory in a list', async () => {
  jest.mocked(native.getLastNotificationResponse).mockReturnValue(response('memory'));
  const view = await render(<NotificationsProvider>{null}</NotificationsProvider>);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: trip.id } }));
  await view.unmount();
  mockTrips = [trip, { ...trip, id: 'second' }];
  await render(<NotificationsProvider>{null}</NotificationsProvider>);
  await waitFor(() => expect(router.push).toHaveBeenLastCalledWith({ pathname: '/memories', params: { day: '2027-09-24' } }));
});
it('does not open a notification belonging to another account', async () => {
  jest.mocked(native.getLastNotificationResponse).mockReturnValue(response('memory', 'someone-else'));
  await render(<NotificationsProvider>{null}</NotificationsProvider>);
  await waitFor(() => expect(native.clearLastNotificationResponseAsync).toHaveBeenCalled());
  expect(router.push).not.toHaveBeenCalled();
});
it('does not persist failed schedules, and rolls back when storage fails', async () => {
  jest.mocked(native.getLastNotificationResponse).mockReturnValue(null);
  let state: ReturnType<typeof useNotifications>;
  function Capture() { state = useNotifications(); return null; }
  await render(<NotificationsProvider><Capture /></NotificationsProvider>);
  await waitFor(() => expect(state.ready).toBe(true));
  const next = { ...defaultSettings, reminders: [{ id: 'r', at: Date.now() + 60000, title: 'write' }] };
  jest.mocked(syncNotifications).mockRejectedValueOnce(new Error('schedule failed'));
  await act(async () => { await expect(state.update(next)).rejects.toThrow('schedule failed'); });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(state!.settings.reminders).toEqual([]);
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage failed'));
  await act(async () => { await expect(state.update(next)).rejects.toThrow('storage failed'); });
  expect(state!.settings.reminders).toEqual([]);
  expect(syncNotifications).toHaveBeenLastCalledWith(session.email, [], expect.any(Function));
});
