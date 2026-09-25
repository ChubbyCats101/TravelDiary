import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useTrips } from '../../contexts/TripsContext';
import AccountGate from '../../components/AccountGate';
import TripForm from '../../components/TripForm';
import { Action, Message, ui } from '../../components/JourneyUI';
export default function Edit() {
  const {id}=useLocalSearchParams<{id:string}>(); const {trips,loading,error,refresh}=useTrips(); const trip=trips.find(t=>t.id===id);
  return <AccountGate>{trip?<TripForm key={trip.id} initial={trip} onSaved={()=>router.back()} />:<View style={ui.content}><Text style={ui.heading}>{loading?'กำลังโหลด…':'ไม่พบบันทึก'}</Text><Message text={error} /><Action title="ลองโหลดใหม่" onPress={()=>void refresh()} /></View>}</AccountGate>;
}
