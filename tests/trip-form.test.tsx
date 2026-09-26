import { fireEvent, render, screen } from '@testing-library/react-native';
import TripForm from '../src/components/TripForm';
import { trip } from './fixtures';

const mockSave = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/contexts/TripsContext', () => ({ useTrips: () => ({ save: mockSave }) }));
jest.mock('../src/components/TripPhoto', () => () => null);
jest.mock('../src/components/VenueMap', () => () => null);
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function MockDatePicker(props: object) { return <View testID="date-picker" {...props} />; };
});

it('keeps coordinates hidden, preserves edits when collapsed, and reveals invalid coordinates on save', async () => {
  await render(<TripForm initial={trip} onSaved={jest.fn()} />);
  expect(screen.queryByLabelText('ละติจูด')).toBeNull();
  await fireEvent.press(screen.getByText('▸ ปรับพิกัดเอง'));
  await fireEvent.changeText(screen.getByLabelText('ละติจูด'), '91');
  await fireEvent.press(screen.getByText('▾ ซ่อนพิกัด'));
  await fireEvent.press(screen.getByText('บันทึกความทรงจำ'));
  expect(screen.getByLabelText('ละติจูด').props.value).toBe('91');
  expect(mockSave).not.toHaveBeenCalled();
});

it('saves a selected local calendar date without shifting it to UTC', async () => {
  await render(<TripForm initial={trip} onSaved={jest.fn()} />);
  await fireEvent.press(screen.getByLabelText(/^เลือกวันที่เดินทาง/));
  await fireEvent(screen.getByTestId('date-picker'), 'onChange', { type: 'set' }, new Date(2024, 1, 29, 0, 15));
  await fireEvent.press(screen.getByText('บันทึกความทรงจำ'));
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2024-02-29' }));
});
