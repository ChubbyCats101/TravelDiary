import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips } from '../../contexts/TripsContext';
import AccountGate from '../../components/AccountGate';
import { Action, Message, ui } from '../../components/JourneyUI';
export default function Profile(){const {session,signOut,error}=useAuth();const {trips}=useTrips();const [message,setMessage]=useState('');return <AccountGate><ScrollView style={ui.page} contentContainerStyle={ui.content}><View style={ui.hero}><Text accessibilityRole="header" style={[ui.title,{color:'#FFF'}]}>นักเก็บความทรงจำ</Text><Text style={{color:'#FFF',fontSize:16}}>{session?.email}</Text></View><View style={ui.card}><Text style={ui.heading}>{trips.length} บันทึกการเดินทาง</Text><Text style={ui.text}>{trips.filter(t=>t.favorite).length} ทริปที่ประทับใจเป็นพิเศษ</Text></View><Text style={ui.text}>TravelDiary เป็นสมุดบันทึกส่วนตัว บัญชีอื่นไม่สามารถเรียกดูหรือแก้ไขบันทึกของคุณผ่าน API ได้</Text><Text style={ui.muted}>บันทึกเก็บบนเซิร์ฟเวอร์ของโปรเจกต์นี้ ต้องเปิดเซิร์ฟเวอร์และเชื่อมต่อเครือข่ายเพื่อโหลดหรือบันทึกทริป รูปถูกย่อก่อนส่ง</Text><Message text={error||message} /><Action secondary title="ออกจากระบบ" onPress={()=>void signOut().catch(()=>setMessage('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'))} /></ScrollView></AccountGate>;}
