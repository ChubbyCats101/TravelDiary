import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import AccountGate from '../src/components/AccountGate';
import { Action, Message, ui } from '../src/components/JourneyUI';
import { useTrips } from '../src/contexts/TripsContext';
import { memoryTrips } from '../src/services/notification-plan';

export default function Memories() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { trips, loading, error, refresh } = useTrips();
  const items = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? memoryTrips(trips, day) : [];
  return <AccountGate><ScrollView contentContainerStyle={ui.content}><Text style={ui.title}>วันนี้ในความทรงจำ</Text>
    <Message text={error} />{error && <Action title="ลองโหลดใหม่" onPress={() => void refresh()} />}
    {loading ? <Text style={ui.text}>กำลังโหลดความทรงจำ…</Text> : !items.length && <Text style={ui.text}>ไม่มีบันทึกตรงวันนี้แล้ว บันทึกอาจถูกแก้ไขหรือลบไป</Text>}
    {items.map(trip => <View style={ui.card} key={trip.id}><Text style={ui.heading}>{trip.title}</Text><Text style={ui.text}>{trip.date} · {trip.location.name}</Text><Action title="อ่านความทรงจำ" accessibilityLabel={`อ่าน ${trip.title}`} onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })} /></View>)}
  </ScrollView></AccountGate>;
}
