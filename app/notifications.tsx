import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AccountGate from '../src/components/AccountGate';
import { Action, Field, Message, ui } from '../src/components/JourneyUI';
import { useNotifications } from '../src/contexts/NotificationsContext';
import { notificationPlan } from '../src/services/notification-plan';
import { useTrips } from '../src/contexts/TripsContext';

export default function NotificationsScreen() {
  return <AccountGate><Settings /></AccountGate>;
}
function Settings() {
  const { settings, ready, error, update, test, retry } = useNotifications();
  const { trips, error: tripsError, refresh } = useTrips();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date(Date.now() + 3600000));
  const [editing, setEditing] = useState<string | null>(null);
  const [picker, setPicker] = useState<'date' | 'time' | 'memory' | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [memoryDraft, setMemoryDraft] = useState(() => new Date());
  const lock = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  const disabled = !ready || busy;
  const pending = settings.reminders.filter(r => r.at > now).sort((a, b) => a.at - b.at);
  async function run(action: () => Promise<void>, done: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(''); setSuccess('');
    try { await action(); setSuccess(done); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    if (!title.trim()) throw new Error('ใส่ข้อความเตือนก่อน');
    if (date.getTime() <= Date.now()) throw new Error('เลือกวันและเวลาในอนาคต');
    const reminder = { id: editing ?? `write-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: title.trim(), at: date.getTime() };
    await update({ ...settings, reminders: [...pending.filter(r => r.id !== editing), reminder] });
    setEditing(null); setTitle('');
  }
  const memoryTime = new Date(); memoryTime.setHours(settings.hour, settings.minute, 0, 0);
  const upcoming = notificationPlan(settings, trips, new Date(now)).filter(p => p.kind === 'memory');
  if (Platform.OS === 'web') return <Text style={ui.text}>เปิด TravelDiary บน Android หรือ iOS เพื่อตั้งการแจ้งเตือน</Text>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content, { maxWidth: 760 }]}>
    <Text style={ui.title}>เก็บเรื่องราวให้ทันความทรงจำ</Text>
    <Text style={ui.muted}>ตั้งเตือนบนมือถือเครื่องนี้ แยกตามบัญชี การเตือนจะหยุดเมื่อออกจากระบบ และกลับมาตั้งใหม่เมื่อเข้าสู่ระบบและโหลดบันทึกสำเร็จ</Text>
    <Message text={message || error || tripsError} />
    {!!success && <Text accessibilityLiveRegion="polite" style={ui.text}>✓ {success}</Text>}
    {(!!error || !!tripsError) && <Action secondary title="ลองโหลดและตั้งเตือนใหม่" disabled={busy} onPress={() => void run(async () => { await refresh(); retry(); }, 'กำลังตรวจสอบการแจ้งเตือนใหม่')} />}
    <View style={ui.card}>
      <Text accessibilityRole="header" style={ui.heading}>{editing ? 'แก้ไขการเตือน' : 'เตือนเฉพาะวันที่เลือก'}</Text>
      <Text style={ui.text}>เตือนครั้งเดียว เมื่อแตะจะเปิดหน้าเพิ่มบันทึก</Text>
      <Field label="ข้อความเตือน" placeholder="เขียนบันทึกทริปเชียงใหม่" value={title} onChangeText={setTitle} maxLength={100} editable={!disabled} />
      <Action secondary title={`วันที่: ${date.toLocaleDateString('th-TH')}`} disabled={disabled} onPress={() => setPicker('date')} />
      <Action secondary title={`เวลา: ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`} disabled={disabled} onPress={() => setPicker('time')} />
      <Action title={editing ? 'บันทึกการแก้ไข' : 'เพิ่มการเตือน'} disabled={disabled} onPress={() => void run(save, 'ตั้งการเตือนแล้ว')} />
      {!!editing && <Action secondary title="ยกเลิกการแก้ไข" disabled={busy} onPress={() => { setEditing(null); setTitle(''); }} />}
    </View>
    <View style={ui.card}>
      <Text accessibilityRole="header" style={ui.heading}>การเตือนที่รอแจ้ง ({pending.length}/20)</Text>
      {!pending.length && <Text style={ui.muted}>ยังไม่มีการเตือนที่รอแจ้ง</Text>}
      {pending.map(item => <View key={item.id} style={{ gap: 8 }}>
        <Text style={ui.text}>{item.title}</Text><Text style={ui.muted}>{new Date(item.at).toLocaleString('th-TH')}</Text>
        <View style={ui.row}><Action secondary title="แก้ไข" accessibilityLabel={`แก้ไข ${item.title}`} disabled={disabled} onPress={() => { setEditing(item.id); setTitle(item.title); setDate(new Date(item.at)); }} />
          <Action secondary title="ยกเลิกเตือน" accessibilityLabel={`ยกเลิกเตือน ${item.title}`} disabled={disabled} onPress={() => void run(async () => { await update({ ...settings, reminders: pending.filter(r => r.id !== item.id) }); if (editing === item.id) { setEditing(null); setTitle(''); } }, 'ยกเลิกการเตือนแล้ว')} /></View>
      </View>)}
    </View>
    <View style={ui.card}>
      <View style={ui.row}><Text accessibilityRole="header" style={ui.heading}>ย้อนความทรงจำ</Text><Switch accessibilityLabel="เปิดย้อนความทรงจำ" value={settings.memories} disabled={disabled} onValueChange={memories => void run(() => update({ ...settings, memories }), memories ? 'เปิดย้อนความทรงจำแล้ว' : 'ปิดย้อนความทรงจำแล้ว')} /></View>
      <Text style={ui.text}>แจ้งวันครบรอบวันที่เดินทาง รวมทริปที่ตรงวันเดียวกันเป็นการเตือนเดียว แตะเพื่ออ่านบันทึกเก่า</Text>
      <Action secondary title={`เวลาแจ้ง: ${memoryTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`} disabled={disabled} onPress={() => { setMemoryDraft(memoryTime); setPicker('memory'); }} />
      <Text style={ui.muted}>29 กุมภาพันธ์จะแจ้งเฉพาะปีอธิกสุรทิน ตั้งล่วงหน้าถึงสิ้นปีที่ 4 นับจากปีนี้ รวมสูงสุด 59 รายการ และเติมตารางเมื่อกลับเข้าแอป</Text>
      {settings.memories && <Text style={ui.text}>{upcoming.length ? `ครั้งถัดไป: ${new Date(upcoming[0].at).toLocaleString('th-TH')}\n${upcoming[0].body}` : 'ยังไม่มีความทรงจำที่ถึงวันครบรอบในช่วงนี้'}</Text>}
    </View>
    {picker && <View style={ui.card}><DateTimePicker value={picker === 'memory' ? memoryDraft : date} mode={picker === 'date' ? 'date' : 'time'} display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={picker === 'date' ? new Date() : undefined} onChange={(event, selected) => {
      if (Platform.OS !== 'ios') setPicker(null);
      if (event.type !== 'set' || !selected) return;
      if (picker === 'memory') { setMemoryDraft(selected); if (Platform.OS !== 'ios') void run(() => update({ ...settings, hour: selected.getHours(), minute: selected.getMinutes() }), 'เปลี่ยนเวลาแจ้งความทรงจำแล้ว'); }
      else { const next = new Date(date); if (picker === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate()); else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0); setDate(next); }
    }} />{Platform.OS === 'ios' && <Action secondary title="เลือกเสร็จแล้ว" disabled={busy} onPress={() => { if (picker === 'memory') void run(() => update({ ...settings, hour: memoryDraft.getHours(), minute: memoryDraft.getMinutes() }), 'เปลี่ยนเวลาแจ้งความทรงจำแล้ว'); setPicker(null); }} />}</View>}
    <Action secondary title="ทดสอบแจ้งเตือนใน 3 วินาที" disabled={disabled} onPress={() => void run(() => test(), 'ตั้งทดสอบแล้ว ลองกลับหน้าจอหลักและรอ 3 วินาที')} />
    <Action secondary title="ทดสอบย้อนความทรงจำใน 3 วินาที" disabled={disabled} onPress={() => void run(() => test(true), 'ตั้งทดสอบความทรงจำแล้ว ข้อความจำลองจากวันครบรอบถัดไป')} />
    <Action secondary title="เปิดการตั้งค่าสิทธิ์แจ้งเตือน" onPress={() => void run(() => Linking.openSettings(), 'เมื่อเปลี่ยนสิทธิ์แล้ว กลับมาที่แอปอีกครั้ง')} />
  </ScrollView>;
}
