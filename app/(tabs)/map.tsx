import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTrips } from '../../contexts/TripsContext';
import AccountGate from '../../components/AccountGate';
import VenueMap from '../../components/VenueMap';
import { Action, Message, ui } from '../../components/JourneyUI';
export default function MapScreen(){
  const {trips,error,loading,refresh}=useTrips(); const [id,setId]=useState('');const selected=trips.find(t=>t.id===id)??trips[0];
  return <AccountGate><View style={ui.page}><FlatList data={trips} keyExtractor={t=>t.id} refreshing={loading} onRefresh={()=>void refresh()} contentContainerStyle={[ui.content,{maxWidth:760}]} ListHeaderComponent={<View style={{gap:16}}><Text accessibilityRole="header" style={ui.title}>รอยทางของความทรงจำ</Text><Text style={ui.text}>เลือกทริปด้านล่างเพื่อดูสถานที่บนแผนที่</Text><Message text={error} />{error&&<Action title="ลองโหลดใหม่" onPress={()=>void refresh()} />}{selected&&<View style={ui.card}><Text accessibilityRole="header" style={ui.heading}>{selected.title}</Text><VenueMap venue={selected.location} /><Action title="อ่านเรื่องราวของทริปนี้" onPress={()=>router.push({pathname:'/trip/[id]',params:{id:selected.id}})} /></View>}</View>} ListEmptyComponent={<Text style={ui.muted}>{loading?'กำลังโหลด…':'เมื่อบันทึกทริปแรก สถานที่จะปรากฏที่นี่'}</Text>} renderItem={({item})=><Action secondary selected={selected?.id===item.id} title={`${item.location.name} · ${item.date}`} onPress={()=>setId(item.id)} />} /></View></AccountGate>;
}
