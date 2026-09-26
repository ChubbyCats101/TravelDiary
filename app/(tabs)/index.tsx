import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips } from '../../src/contexts/TripsContext';
import AccountGate from '../../src/components/AccountGate';
import { Action, Field, Message, ui } from '../../src/components/JourneyUI';

export default function Diary() {
  const { trips, loading, error, refresh } = useTrips();
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(false);
  const term = query.trim().toLowerCase();
  const data = trips.filter(t => (!favorites || t.favorite) && `${t.title} ${t.location.name} ${t.note}`.toLowerCase().includes(term));
  return <AccountGate><View style={ui.page}>
    <FlatList data={data} keyExtractor={t => t.id} refreshing={loading} onRefresh={() => void refresh()}
      contentContainerStyle={[ui.content, { maxWidth: 760, gap: 22 }]}
      ListHeaderComponent={<View style={{ gap: 16 }}>
        <View style={styles.brand}><Ionicons accessible={false} name="compass-outline" size={24} color="#1D3557" /><Text style={ui.eyebrow}>TRAVEL DIARY</Text><View style={styles.brandLine} /></View>
        <View style={[ui.hero, trips.length > 0 && { padding: 18, gap: 12 }]}>
          <View pointerEvents="none" accessible={false} style={styles.orbit} />
          <Text accessibilityRole="header" style={[ui.title, { color: '#FFFFFF', fontSize: trips.length ? 22 : 30, lineHeight: trips.length ? 32 : 44 }]}>{trips.length ? 'วันนี้มีเรื่องไหนอยากจำ?' : 'ไปที่ไหนมา\nเล่าให้ความทรงจำฟัง'}</Text>
          {trips.length === 0 && <Text style={{ color: '#DEE8F3', fontSize: 15, lineHeight: 24 }}>เก็บวันธรรมดาและการเดินทางครั้งพิเศษไว้ในที่เดียว</Text>}
          <Action title="＋ บันทึกการเดินทางใหม่" onPress={() => router.push('/add')} />
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.count}>{trips.length}</Text><Text style={ui.muted}>การเดินทาง</Text></View>
          <View style={styles.stat}><Text style={styles.count}>{trips.filter(t => t.favorite).length}</Text><Text style={ui.muted}>ทริปโปรด</Text></View>
        </View>
        <Field label="ค้นหาทริป สถานที่ หรือความทรงจำ" placeholder="อยากกลับไปนึกถึงที่ไหน…" value={query} onChangeText={setQuery} />
        <View style={[ui.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={ui.heading}>บันทึกของฉัน</Text><Action secondary selected={favorites} title="ทริปโปรด" accessibilityLabel="แสดงเฉพาะทริปโปรด" onPress={() => setFavorites(v => !v)} /></View>
        <Message text={error} />{error && <Action title="ลองโหลดอีกครั้ง" onPress={() => void refresh()} />}
      </View>}
      ListEmptyComponent={<View style={[ui.card, { alignItems: 'center', paddingVertical: 32 }]}>
        <Ionicons accessible={false} name="book-outline" size={40} color="#82613D" />
        <Text style={[ui.heading, { textAlign: 'center' }]}>{loading ? 'กำลังโหลดบันทึก…' : trips.length ? 'ยังไม่พบเรื่องราวที่ค้นหา' : 'หน้ากระดาษแรกยังว่างอยู่'}</Text>
        <Text style={[ui.muted, { textAlign: 'center' }]}>{trips.length ? 'ลองเปลี่ยนคำค้นหรือตัวกรอง' : 'เริ่มจากทริปใกล้บ้านก็ได้ บันทึกสถานที่ วันที่ และความรู้สึกดี ๆ ของคุณ'}</Text>
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`เปิดบันทึก ${item.title}`} accessibilityHint={`${item.location.name} · ${item.date}`} onPress={() => router.push({ pathname: '/trip/[id]', params: { id: item.id } })} style={({ pressed }) => [ui.card, { padding: 0, overflow: 'hidden', gap: 0, opacity: pressed ? 0.8 : 1 }]}>
        {item.photo ? <Image accessibilityLabel={`ภาพ ${item.title}`} source={{ uri: item.photo }} style={{ width: '100%', aspectRatio: 1.5, backgroundColor: '#E8EFF4' }} /> : <View style={styles.placeholder}><Ionicons accessible={false} name="trail-sign-outline" size={24} color="#82613D" /><Text style={ui.muted}>สถานที่ในความทรงจำ</Text></View>}
        <View style={{ padding: 20, gap: 12 }}>
          <View style={ui.row}><View style={ui.badge}><Text style={[ui.muted, { fontSize: 12 }]}>{item.date}</Text></View>{item.favorite && <Text style={{ color: '#87522F', fontSize: 13, fontWeight: '600' }}>★ ทริปโปรด</Text>}</View>
          <Text accessibilityRole="header" style={[ui.heading, { fontSize: 23 }]}>{item.title}</Text>
          <View style={[ui.row, { flexWrap: 'nowrap' }]}><Ionicons accessible={false} name="location-outline" size={18} color="#82613D" /><Text style={[ui.muted, { flex: 1 }]}>{item.location.name}</Text></View>
          {!!item.note && <Text numberOfLines={3} style={ui.text}>{item.note}</Text>}
          <Text style={{ color: '#1D3557', fontWeight: '700', paddingVertical: 8 }}>เปิดบันทึก →</Text>
        </View>
      </Pressable>} />
  </View></AccountGate>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLine: { flex: 1, height: 1, backgroundColor: '#D8E2EB' },
  orbit: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: '#46617F', top: -95, right: -100 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flex: 1, minWidth: 85, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: '#F5E8D8', borderRadius: 20, alignItems: 'center', gap: 4 },
  count: { fontSize: 26, fontWeight: '800', color: '#1D3557' },
  placeholder: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F5E8D8', alignItems: 'center', gap: 10, padding: 16 },
});
