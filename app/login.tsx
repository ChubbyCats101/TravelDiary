import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Action, Field, Message, ui } from '../components/JourneyUI';
export default function Login() {
  const { signIn } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [create, setCreate] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) { setError('กรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร'); return; }
    lock.current = true; setBusy(true); setError('');
    try { await signIn(email.trim(), password, create); setPassword(''); router.replace('/'); }
    catch (e) { setError(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content, { maxWidth: 560 }]}><Text style={ui.title}>{create ? 'สร้างบัญชี TravelDiary' : 'ทุกทริปมีเรื่องเล่า'}</Text><Text style={ui.text}>เข้าสู่ระบบเพื่อเก็บภาพ สถานที่ และความทรงจำของคุณ</Text><Text style={ui.muted}>ระบบสาธิตสำหรับรายวิชา ใช้อีเมลและรหัสผ่านสำหรับทดสอบเท่านั้น</Text><Field label="อีเมล" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxLength={200} /><Field label="รหัสผ่าน (8–128 ตัวอักษร)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={128} onSubmitEditing={() => void submit()} /><Message text={error} /><Action disabled={busy} title={busy ? 'กำลังดำเนินการ…' : create ? 'สร้างบัญชีและเข้าสู่ระบบ' : 'เข้าสู่ระบบ'} onPress={() => void submit()} /><Action secondary disabled={busy} title={create ? 'มีบัญชีแล้ว · เข้าสู่ระบบ' : 'ยังไม่มีบัญชี · สมัครสมาชิก'} onPress={() => { setCreate(v => !v); setError(''); }} /></ScrollView></KeyboardAvoidingView>;
}
