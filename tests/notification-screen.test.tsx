import { fireEvent, render, screen } from '@testing-library/react-native';
import NotificationsScreen from '../app/notifications';
import { defaultSettings } from '../src/services/notification-plan';

const mockUpdate = jest.fn();
const mockTest = jest.fn();
jest.mock('../src/components/AccountGate', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../src/contexts/NotificationsContext', () => ({ useNotifications: () => ({ settings: { ...jest.requireActual('../src/services/notification-plan').defaultSettings }, ready: true, error: '', update: mockUpdate, test: mockTest, retry: jest.fn() }) }));
jest.mock('../src/contexts/TripsContext', () => ({ useTrips: () => ({ trips: [], error: '', refresh: jest.fn() }) }));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

it('validates a reminder, saves it, enables memories, and offers both test flows', async () => {
  await render(<NotificationsScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'เพิ่มการเตือน' }));
  await screen.findByText('ใส่ข้อความเตือนก่อน');
  expect(mockUpdate).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('ข้อความเตือน'), 'เขียนทริปทะเล');
  await fireEvent.press(screen.getByRole('button', { name: 'เพิ่มการเตือน' }));
  await screen.findByText('✓ ตั้งการเตือนแล้ว');
  expect(mockUpdate).toHaveBeenCalledWith({ ...defaultSettings, reminders: [expect.objectContaining({ title: 'เขียนทริปทะเล', at: expect.any(Number) })] });
  await fireEvent(screen.getByLabelText('เปิดย้อนความทรงจำ'), 'valueChange', true);
  expect(mockUpdate).toHaveBeenLastCalledWith({ ...defaultSettings, memories: true });
  await fireEvent.press(screen.getByRole('button', { name: 'ทดสอบแจ้งเตือนใน 3 วินาที' }));
  expect(mockTest).toHaveBeenCalledWith();
  await fireEvent.press(screen.getByRole('button', { name: 'ทดสอบย้อนความทรงจำใน 3 วินาที' }));
  expect(mockTest).toHaveBeenCalledWith(true);
});
it('keeps the reminder draft when scheduling fails', async () => {
  mockUpdate.mockRejectedValueOnce(new Error('ไม่ได้รับสิทธิ์'));
  await render(<NotificationsScreen />);
  await fireEvent.changeText(screen.getByLabelText('ข้อความเตือน'), 'เก็บรูปเชียงใหม่');
  await fireEvent.press(screen.getByRole('button', { name: 'เพิ่มการเตือน' }));
  await screen.findByText('ไม่ได้รับสิทธิ์');
  expect(screen.getByLabelText('ข้อความเตือน').props.value).toBe('เก็บรูปเชียงใหม่');
});
