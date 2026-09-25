import { useRef, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTrips } from '../../contexts/TripsContext';
import AccountGate from '../../components/AccountGate';
import VenueMap from '../../components/VenueMap';
import { Action, Message, ui } from '../../components/JourneyUI';
export default function Detail() {
  const {id}=useLocalSearchParams<{id:string}>(); const {trips,loading,error,refresh,remove,save}=useTrips(); const trip=trips.find(t=>t.id===id);
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
  async function action(fn:()=>Promise<void>) {if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'ทำรายการไม่ได้');}finally{lock.current=false;setBusy(false);}}
  function confirmDelete(){Alert.alert('ลบบันทึกนี้?',`“${trip?.title}” จะถูกลบพร้อมรูปและความทรงจำ`,[{text:'เก็บไว้',style:'cancel'},{text:'ลบบันทึก',style:'destructive',onPress:()=>void action(async()=>{await remove(id);router.replace('/');})}]);}
  return <AccountGate><ScrollView style={ui.page} contentContainerStyle={[ui.content,{maxWidth:760}]}>{trip?<><Text style={ui.muted}>{trip.date} · {trip.favorite?'★ ทริปโปรด':'บันทึกการเดินทาง'}</Text><Text accessibilityRole="header" style={ui.title}>{trip.title}</Text><Text style={ui.heading}>{trip.location.name}</Text>{trip.photo&&<Image accessibilityLabel={`ภาพ ${trip.title}`} source={{uri:trip.photo}} style={[ui.photo,{height:320}]} resizeMode="contain" />}<View style={ui.card}><Text accessibilityRole="header" style={ui.heading}>เรื่องราวที่อยากจำ</Text><Text selectable style={ui.text}>{trip.note||'ยังไม่ได้เขียนความทรงจำ เพิ่มเรื่องราวได้จากปุ่มแก้ไขบันทึก'}</Text></View><VenueMap venue={trip.location} /><Text selectable style={ui.muted}>{trip.location.latitude}, {trip.location.longitude}</Text><Action secondary selected={trip.favorite} title={trip.favorite?'★ ทริปโปรด':'☆ เก็บเป็นทริปโปรด'} disabled={busy} onPress={()=>void action(()=>save({...trip,favorite:!trip.favorite}))} /><Action title="แก้ไขบันทึก" disabled={busy} onPress={()=>router.push({pathname:'/edit/[id]',params:{id}})} /><Action secondary title="ลบบันทึก" disabled={busy} onPress={confirmDelete} /><Message text={message} /></>:<><Text style={ui.heading}>{loading?'กำลังโหลดบันทึก…':'ไม่พบบันทึกนี้'}</Text><Message text={error} /><Action title="ลองโหลดใหม่" onPress={()=>void refresh()} /><Action secondary title="กลับไปบันทึกของฉัน" onPress={()=>router.replace('/')} /></>}</ScrollView></AccountGate>;
}
