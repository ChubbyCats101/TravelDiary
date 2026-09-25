import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Action, Field, Message, ui } from './JourneyUI';

export default function TripDate({ value, onChange, disabled, error }: {
  value: string; onChange: (value: string) => void; disabled: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  const label = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  if (Platform.OS === 'web') return <Field label="วันที่เดินทาง (ค.ศ. YYYY-MM-DD)" value={value} onChangeText={onChange} editable={!disabled} error={error} />;
  return <View style={{ gap: 6 }}>
    <Text style={ui.text}>วันที่เดินทาง</Text>
    <Action secondary title={`📅 ${label}`} accessibilityLabel={`เลือกวันที่เดินทาง ${label}`} disabled={disabled} onPress={() => setOpen(true)} />
    {open && !disabled && <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(event, selected) => {
      if (Platform.OS !== 'ios') setOpen(false);
      if (event.type === 'set' && selected) {
        onChange(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`);
      }
    }} />}
    {open && Platform.OS === 'ios' && <Action secondary title="เลือกวันที่เสร็จแล้ว" onPress={() => setOpen(false)} />}
    <Message text={error ?? ''} />
  </View>;
}
