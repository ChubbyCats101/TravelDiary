import { Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import AccountGate from '../components/AccountGate';
import Login from '../app/login';
import { authenticate, verifySession, ApiError } from '../services/api';
import { session } from './fixtures';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../services/api', () => ({ ...jest.requireActual('../services/api'), authenticate: jest.fn(), verifySession: jest.fn() }));

beforeEach(() => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue();
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue();
  jest.mocked(authenticate).mockResolvedValue(session);
  jest.mocked(verifySession).mockResolvedValue();
});

function mount() {
  return render(<AuthProvider><Login /><AccountGate><Text>บันทึกส่วนตัว</Text></AccountGate></AuthProvider>);
}
async function fill(email = session.email) {
  await fireEvent.changeText(screen.getByLabelText('อีเมล'), email);
  await fireEvent.changeText(screen.getByLabelText('รหัสผ่าน (8–128 ตัวอักษร)'), 'test-only-password');
  await fireEvent.press(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
}

it('blocks private content, then persists login and opens the protected content', async () => {
  await mount();
  await screen.findByRole('button', { name: 'เข้าสู่ระบบ / สร้างบัญชี' });
  expect(screen.queryByText('บันทึกส่วนตัว')).toBeNull();
  await fill();
  await screen.findByText('บันทึกส่วนตัว');
  expect(authenticate).toHaveBeenCalledWith(session.email, 'test-only-password', false);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('traveldiary-session', JSON.stringify(session));
  expect(router.replace).toHaveBeenCalledWith('/');
});

it('shows invalid email without calling the API', async () => {
  await mount();
  await screen.findByRole('button', { name: 'เข้าสู่ระบบ / สร้างบัญชี' });
  await fill('invalid');
  expect(screen.getByText('กรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร')).toBeTruthy();
  expect(authenticate).not.toHaveBeenCalled();
});

it('keeps private content locked when secure persistence fails', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('บันทึกเซสชันไม่ได้'));
  await mount();
  await screen.findByRole('button', { name: 'เข้าสู่ระบบ / สร้างบัญชี' });
  await fill();
  await screen.findByText('บันทึกเซสชันไม่ได้');
  expect(screen.queryByText('บันทึกส่วนตัว')).toBeNull();
  expect(router.replace).not.toHaveBeenCalled();
});

it('removes a revoked saved session before showing protected content', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(JSON.stringify(session));
  jest.mocked(verifySession).mockRejectedValueOnce(new ApiError(401, 'หมดอายุ'));
  await mount();
  await screen.findByRole('button', { name: 'เข้าสู่ระบบ / สร้างบัญชี' });
  expect(screen.queryByText('บันทึกส่วนตัว')).toBeNull();
  await waitFor(() => expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('traveldiary-session'));
});

