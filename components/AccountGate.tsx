import { Text, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Action, ui } from './JourneyUI';
import type { PropsWithChildren } from 'react';
export default function AccountGate({children}: PropsWithChildren) {
  const {session,ready} = useAuth();
  if (!ready) return <ActivityIndicator accessibilityLabel="กำลังตรวจบัญชี" />;
  if (!session) return <View style={[ui.page,ui.content,{justifyContent:'center',gap:20}]}><Text style={ui.muted}>TRAVELDIARY / YOUR PERSONAL JOURNAL</Text><Text accessibilityRole="header" style={ui.title}>เก็บทุกการเดินทาง{ '\n' }ให้เป็นความทรงจำ</Text><Text style={ui.text}>รูปหนึ่งใบ สถานที่หนึ่งแห่ง และเรื่องราวในแบบของคุณ เริ่มบันทึกทริปแรกได้เลย</Text><Action title="เข้าสู่ระบบ / สร้างบัญชี" onPress={() => router.push('/login')} /></View>;
  return <>{children}</>;
}
