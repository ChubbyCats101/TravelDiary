import { useState } from 'react';
import TripDate from './TripDate';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useTripForm } from '../hooks/useTripForm';
import type { Trip } from '../types/trip';
import TripPhoto from './TripPhoto';
import VenueMap from './VenueMap';
import { Action, Field, Message, ui } from './JourneyUI';
export default function TripForm({initial,onSaved}:{initial?:Trip;onSaved:(id:string)=>void}) {
  const f=useTripForm(initial,onSaved);
  const [manualCoordinates, setManualCoordinates] = useState(false);
  return <KeyboardAvoidingView style={ui.page} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{maxWidth:760}]}><Text accessibilityRole="header" style={ui.title}>{initial?'กลับมาเติมเรื่องราว':'วันนี้มีเรื่องไหนอยากจำ?'}</Text><Text style={ui.muted}>หนึ่งบันทึกต่อหนึ่งทริป พร้อมภาพหนึ่งใบและสถานที่ของคุณ</Text>
    <View style={ui.card}><Text style={ui.eyebrow}>รายละเอียดการเดินทาง</Text><Field label="ชื่อทริป" placeholder="เช่น เช้าวันหยุดที่เชียงใหม่" value={f.title} onChangeText={f.setTitle} editable={!f.busy} maxLength={100} error={f.submitted?f.errors.title:''} />
    <Field label="ความทรงจำของทริปนี้" placeholder="อะไรทำให้วันนี้พิเศษ?" value={f.note} onChangeText={f.setNote} editable={!f.busy} multiline maxLength={4000} error={f.submitted?f.errors.note:''} />
    <TripDate value={f.date} onChange={f.setDate} disabled={f.busy} error={f.submitted?f.errors.date:''} />
    <Field label="สถานที่" placeholder="ชื่อสถานที่ที่อยากเก็บไว้" value={f.place} onChangeText={f.setPlace} editable={!f.busy} maxLength={200} /></View>
    <View style={ui.card}><Text accessibilityRole="header" style={ui.heading}>ปักหมุดความทรงจำ</Text><Text style={ui.muted}>แตะแผนที่เพื่อปักหมุด หรือลากหมุดไปยังสถานที่ที่อยากจำ</Text><Action secondary title={f.locating?'กำลังหาตำแหน่ง…':'ใช้ตำแหน่งปัจจุบัน'} disabled={f.busy||f.locating} onPress={()=>void f.locate()} /><VenueMap venue={f.validCoordinates ? {...f.location,name:f.place||'สถานที่ของทริป'} : undefined} onChange={f.busy||f.locating?undefined:f.choosePoint} /><Text accessibilityLiveRegion="polite" style={ui.muted}>{f.validCoordinates?'เลือกหมุดแล้ว — ลากหมุดหรือแตะจุดใหม่เพื่อเปลี่ยนได้':'ยังไม่ได้เลือกสถานที่ — แตะบนแผนที่เพื่อปักหมุด'}</Text><Action secondary title={manualCoordinates?'▾ ซ่อนพิกัด':'▸ ปรับพิกัดเอง'} onPress={()=>setManualCoordinates(value=>!value)} />{manualCoordinates&&<><Field label="ละติจูด" value={f.lat} onChangeText={f.setLat} editable={!f.busy&&!f.locating} keyboardType="numbers-and-punctuation" /><Field label="ลองจิจูด" value={f.lng} onChangeText={f.setLng} editable={!f.busy&&!f.locating} keyboardType="numbers-and-punctuation" /></>}{f.submitted&&<Message text={f.errors.location} />}{f.settings&&<Action secondary title="เปิดการตั้งค่าสิทธิ์ตำแหน่ง" onPress={()=>void Linking.openSettings().catch(()=>f.setError('เปิดการตั้งค่าไม่ได้'))} />}</View>
    <TripPhoto value={f.photo} onChange={f.setPhoto} disabled={f.busy} onBusyChange={f.setPhotoBusy} />
    <Action secondary selected={f.favorite} title="เก็บเป็นทริปโปรด" disabled={f.busy} onPress={()=>f.setFavorite(v=>!v)} /><Message text={f.error} /><Action title={f.busy?'กำลังบันทึก…':'บันทึกความทรงจำ'} disabled={f.busy||f.photoBusy||f.locating} onPress={()=>{if(!f.validCoordinates)setManualCoordinates(true);void f.submit();}} />
  </ScrollView></KeyboardAvoidingView>;
}
