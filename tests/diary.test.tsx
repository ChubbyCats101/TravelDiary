import type { PropsWithChildren } from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { TripsProvider, useTrips } from '../contexts/TripsContext';
import { useTripForm } from '../hooks/useTripForm';
import Diary from '../app/(tabs)/index';
import { ApiError, authenticate, listTrips, saveTrip, deleteTrip, verifySession } from '../services/api';
import { session, trip } from './fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../services/api', () => ({
  ...jest.requireActual('../services/api'),
  authenticate: jest.fn(), listTrips: jest.fn(), saveTrip: jest.fn(), deleteTrip: jest.fn(), verifySession: jest.fn(),
}));

function Providers({ children }: PropsWithChildren) {
  return <AuthProvider><TripsProvider>{children}</TripsProvider></AuthProvider>;
}
beforeEach(() => {
  jest.mocked(saveTrip).mockReset();
  jest.mocked(deleteTrip).mockReset();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(session));
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue();
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue();
  jest.mocked(verifySession).mockResolvedValue();
  jest.mocked(listTrips).mockResolvedValue([trip, { ...trip, id: 'favorite', title: 'ขอนแก่น', favorite: true }]);
  jest.mocked(saveTrip).mockImplementation(async draft => ({ ...trip, ...draft }));
  jest.mocked(deleteTrip).mockResolvedValue();
});

it('opens the selected diary card with its trip ID', async () => {
  await render(<Diary />, { wrapper: Providers });
  await fireEvent.press(await screen.findByRole('button', { name: 'เปิดบันทึก เชียงใหม่' }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: trip.id } });
});

it('filters favorite trips and searches the visible diary', async () => {
  await render(<Diary />, { wrapper: Providers });
  await screen.findByRole('button', { name: 'เปิดบันทึก เชียงใหม่' });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'แสดงเฉพาะทริปโปรด' }));
  expect(screen.queryByRole('button', { name: 'เปิดบันทึก เชียงใหม่' })).toBeNull();
  expect(screen.getByRole('button', { name: 'เปิดบันทึก ขอนแก่น' })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('ค้นหาทริป สถานที่ หรือความทรงจำ'), 'ไม่พบ');
  expect(screen.getByText('ยังไม่พบเรื่องราวที่ค้นหา')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('ค้นหาทริป สถานที่ หรือความทรงจำ'), '');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'แสดงเฉพาะทริปโปรด' }));
  expect(screen.getByRole('button', { name: 'เปิดบันทึก เชียงใหม่' })).toBeTruthy();
});

it('saves favorite on and off through the real form hook and provider', async () => {
  const onSaved = jest.fn();
  const { result } = await renderHook(() => ({ form: useTripForm(trip, onSaved), auth: useAuth() }), { wrapper: Providers });
  await waitFor(() => expect(result.current.auth.session).not.toBeNull());
  await act(() => result.current.form.setFavorite(true));
  await act(() => result.current.form.submit());
  expect(saveTrip).toHaveBeenLastCalledWith(expect.objectContaining({ id: trip.id, favorite: true }), session.token);
  expect(onSaved).toHaveBeenCalledWith(trip.id);
  await act(() => result.current.form.setFavorite(false));
  await act(() => result.current.form.submit());
  expect(saveTrip).toHaveBeenLastCalledWith(expect.objectContaining({ id: trip.id, favorite: false }), session.token);
});

it('does not submit an invalid trip through the form hook', async () => {
  const onSaved = jest.fn();
  const { result } = await renderHook(() => ({ form: useTripForm(undefined, onSaved), auth: useAuth() }), { wrapper: Providers });
  await waitFor(() => expect(result.current.auth.ready).toBe(true));
  await act(() => result.current.form.submit());
  expect(result.current.form.errors.title).not.toBe('');
  expect(saveTrip).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();
});

it.each(['save', 'remove'] as const)('expires a rejected session after %s returns 401 (regression)', async operation => {
  const denied = new ApiError(401, 'เซสชันหมดอายุ');
  jest.mocked(saveTrip).mockRejectedValueOnce(denied);
  jest.mocked(deleteTrip).mockRejectedValueOnce(denied);
  const { result } = await renderHook(() => ({ auth: useAuth(), trips: useTrips() }), { wrapper: Providers });
  await waitFor(() => expect(result.current.trips.trips).toHaveLength(2));
  await act(async () => {
    await expect(operation === 'save' ? result.current.trips.save(trip) : result.current.trips.remove(trip.id)).rejects.toThrow('เซสชันหมดอายุ');
  });
  await waitFor(() => expect(result.current.auth.session).toBeNull());
  expect(result.current.trips.trips).toEqual([]);
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('traveldiary-session');
});

it('preserves the current session and trip when saving fails with a network error', async () => {
  jest.mocked(saveTrip).mockRejectedValueOnce(new Error('เครือข่ายขัดข้อง'));
  const { result } = await renderHook(() => ({ auth: useAuth(), trips: useTrips() }), { wrapper: Providers });
  await waitFor(() => expect(result.current.trips.trips).toHaveLength(2));
  await act(async () => { await expect(result.current.trips.save(trip)).rejects.toThrow('เครือข่ายขัดข้อง'); });
  expect(result.current.auth.session).toEqual(session);
  expect(result.current.trips.trips).toHaveLength(2);
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
});

it.each(['save', 'remove'] as const)('ignores an old account 401 after switching accounts during %s', async operation => {
  let rejectRequest!: (error: Error) => void;
  const pending = new Promise<never>((_, reject) => { rejectRequest = reject; });
  if (operation === 'save') jest.mocked(saveTrip).mockReturnValueOnce(pending);
  else jest.mocked(deleteTrip).mockReturnValueOnce(pending);
  const nextSession = { ...session, token: 'b'.repeat(64), email: 'other@example.test' };
  jest.mocked(authenticate).mockResolvedValueOnce(nextSession);
  const { result } = await renderHook(() => ({ auth: useAuth(), trips: useTrips() }), { wrapper: Providers });
  await waitFor(() => expect(result.current.trips.trips).toHaveLength(2));
  let operationResult!: Promise<unknown>;
  await act(() => {
    operationResult = (operation === 'save' ? result.current.trips.save(trip) : result.current.trips.remove(trip.id)).catch(error => error);
  });
  await act(() => result.current.auth.signIn(nextSession.email, 'test-only-password', false));
  await act(async () => {
    rejectRequest(new ApiError(401, 'old account expired'));
    await operationResult;
  });
  expect(result.current.auth.session).toEqual(nextSession);
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
});
