import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTrips } from '../../src/contexts/TripsContext';
import AccountGate from '../../src/components/AccountGate';
import { Action, Field, Message, ui } from '../../src/components/JourneyUI';
import { getProfile, saveProfile, type UserProfile } from '../../src/services/api';
import type { Session } from '../../src/types/event';

export default function Profile() {
  const { session } = useAuth();
  return <AccountGate>{session && <ProfileContent key={session.token} session={session} />}</AccountGate>;
}

function ProfileContent({ session }: { session: Session }) {
  const { signOut, error } = useAuth();
  const { trips } = useTrips();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [nameError, setNameError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    getProfile(session.token, controller.signal).then(setProfile).catch(e => {
      if (!controller.signal.aborted) setMessage(e instanceof Error ? e.message : 'โหลดโปรไฟล์ไม่ได้');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session.token, attempt]);

  async function choosePhoto() {
    const editable = draft ?? profile;
    if (lock.current || !editable) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) throw new Error('เลือกรูปขนาดไม่เกิน 10 MB');
      const photo = await manipulateAsync(asset.uri, [{ resize: asset.width >= asset.height ? { width: Math.min(512, asset.width) } : { height: Math.min(512, asset.height) } }], { compress: .8, format: SaveFormat.JPEG, base64: true });
      const uri = 'data:image/jpeg;base64,' + photo.base64;
      if (!photo.base64 || uri.length > 700_000) throw new Error('รูปใหญ่เกินไป กรุณาเลือกรูปอื่น');
      setDraft({ ...editable, photo: uri }); setSuccess('');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'เลือกรูปไม่ได้'); }
    finally { lock.current = false; setBusy(false); }
  }

  async function save() {
    if (lock.current || !draft) return;
    if (!draft.name.trim()) { setNameError('กรุณากรอกชื่อที่แสดง'); return; }
    lock.current = true; setBusy(true); setMessage(''); setSuccess('');
    try {
      const saved = await saveProfile(draft, session.token);
      setProfile(saved); setDraft(null); setSuccess('บันทึกโปรไฟล์แล้ว');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'บันทึกโปรไฟล์ไม่ได้ กรุณาลองใหม่'); }
    finally { lock.current = false; setBusy(false); }
  }

  const shown = draft ?? profile;
  return <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content, { maxWidth: 760 }]}>
      <View style={[ui.hero, { alignItems: 'center' }, draft && { padding: 18, gap: 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="เปลี่ยนรูปโปรไฟล์" accessibilityState={{ disabled: busy || !profile }} disabled={busy || !profile} onPress={() => void choosePhoto()} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {shown?.photo ? <Image accessibilityLabel="รูปโปรไฟล์" source={{ uri: shown.photo }} style={styles.avatar} /> : <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}><Ionicons accessible={false} name="person-outline" size={44} color="#1D3557" /></View>}
        <View pointerEvents="none" style={styles.cameraBadge}><Ionicons accessible={false} name="camera-outline" size={20} color="#172B46" /></View>
        </Pressable>
        <Text accessibilityRole="header" style={[ui.title, { color: '#FFFFFF', textAlign: 'center' }]}>{shown?.name || 'โปรไฟล์ของฉัน'}</Text>
        <Text style={{ color: '#DEE8F3', textAlign: 'center' }}>{session.email}</Text>
        {!!shown?.bio && <Text numberOfLines={draft ? 2 : undefined} style={{ color: '#FFFFFF', lineHeight: 24, textAlign: 'center' }}>{shown.bio}</Text>}
        {draft && <Text style={{ color: '#DEE8F3' }}>ตัวอย่าง · ยังไม่ได้บันทึก</Text>}
        {profile && !draft && <Action secondary title="แก้ไขโปรไฟล์" onPress={() => { setDraft({ ...profile }); setMessage(''); setSuccess(''); }} />}
      </View>
      {loading && <Text accessibilityLiveRegion="polite" style={ui.muted}>กำลังโหลดโปรไฟล์…</Text>}
      {!loading && !profile && <Action title="ลองโหลดโปรไฟล์อีกครั้ง" onPress={() => { setLoading(true); setMessage(''); setAttempt(v => v + 1); }} />}
      {draft && <View style={ui.card}>
        <Text accessibilityRole="header" style={ui.heading}>แต่งโปรไฟล์ในแบบคุณ</Text>
        <View style={ui.row}><Action secondary title="เลือกรูปโปรไฟล์" disabled={busy} onPress={() => void choosePhoto()} />{draft.photo && <Action secondary title="นำรูปโปรไฟล์ออก" disabled={busy} onPress={() => setDraft({ ...draft, photo: null })} />}</View>
        <Field label="ชื่อที่แสดง" value={draft.name} editable={!busy} maxLength={60} error={nameError} onChangeText={name => { setDraft({ ...draft, name }); setNameError(''); }} placeholder="อยากให้เรียกคุณว่าอะไร?" />
        <Field label="แนะนำตัว" value={draft.bio} editable={!busy} multiline maxLength={300} onChangeText={bio => setDraft({ ...draft, bio })} placeholder="ชอบเดินทางแบบไหน หรือมีที่ไหนที่อยากไป…" />
        <Text style={ui.muted}>{draft.bio.length}/300 ตัวอักษร</Text>
        <Text style={ui.muted}>อีเมลสำหรับเข้าสู่ระบบยังคงเดิม</Text>
        <Action title={busy ? 'กำลังดำเนินการ…' : 'บันทึกโปรไฟล์'} disabled={busy} onPress={() => void save()} />
        <Action secondary title="ยกเลิกการแก้ไข" disabled={busy} onPress={() => { setDraft(null); setMessage(''); setNameError(''); }} />
      </View>}
      <Message text={error || message} />
      {!!success && <Text accessibilityLiveRegion="polite" style={ui.text}>✓ {success}</Text>}
      <View style={ui.card}><Text style={ui.eyebrow}>เรื่องราวที่ผ่านมา</Text><Text style={ui.heading}>{trips.length} บันทึกการเดินทาง</Text><Text style={ui.text}>{trips.filter(t => t.favorite).length} ทริปที่ประทับใจเป็นพิเศษ</Text></View>
      <Text style={ui.muted}>โปรไฟล์และบันทึกเป็นส่วนตัว ข้อมูลที่บันทึกแล้วจะอยู่กับบัญชีของคุณ</Text>
      <Action secondary title="การแจ้งเตือน" onPress={() => router.push('/notifications')} />
      <Action secondary title="ออกจากระบบ" disabled={busy} onPress={() => void signOut().catch(() => setMessage('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'))} />
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#EDF2F6', borderWidth: 4, borderColor: '#D4A373' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1D3557' },
});
