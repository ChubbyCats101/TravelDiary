import { useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { isVenue, type Venue } from '../types/event';
import { venueMapHtml } from '../services/venue-map-html';
import { Action, ui } from './JourneyUI';
const source = { html: venueMapHtml, baseUrl: 'https://www.openstreetmap.org/' };
export default function VenueMap({ venue, onChange }: { venue?: Venue; onChange?: (venue: Venue) => void }) {
  const web = useRef<WebView>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('กำลังโหลดแผนที่…');
  const update = `window.updateVenue && window.updateVenue(${JSON.stringify(venue?.latitude ?? null)},${JSON.stringify(venue?.longitude ?? null)},${!!onChange});true;`;
  useEffect(() => { web.current?.injectJavaScript(update); }, [update]);
  useEffect(() => {
    const timer = setTimeout(() => setStatus(current => current === 'กำลังโหลดแผนที่…' ? 'โหลดแผนที่ไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่' : current), 15000);
    return () => clearTimeout(timer);
  }, [attempt]);
  return <View style={{ gap: 8 }}>
    <View style={{ height: 300, borderRadius: 14, overflow: 'hidden' }}>
      <WebView key={attempt} ref={web} source={source} originWhitelist={['*']}
        accessibilityLabel={venue ? `แผนที่ ${venue.name}` : 'แผนที่เลือกสถานที่ แตะเพื่อปักหมุด หรือกรอกพิกัดด้านล่าง'} javaScriptEnabled scrollEnabled={false}
        onShouldStartLoadWithRequest={request => {
          if (request.url === 'about:blank' || request.url === source.baseUrl) return true;
          if (request.url === 'https://www.openstreetmap.org/copyright') void Linking.openURL(request.url).catch(() => {});
          return false;
        }}
        onError={() => setStatus('โหลดแผนที่ไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่')}
        onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready') web.current?.injectJavaScript(update);
            if (message.type === 'loaded') setStatus('');
            if (message.type === 'error') setStatus('แผนที่บางส่วนโหลดไม่ได้ กรุณาลองใหม่');
            if (message.type === 'script-error') setStatus('โหลดตัวแสดงแผนที่จาก unpkg.com ไม่ได้ กรุณาตรวจเครือข่ายแล้วลองใหม่');
            const point = { name: 'สถานที่ที่เลือก', latitude: message.latitude, longitude: message.longitude };
            if (message.type === 'point' && isVenue(point)) onChange?.(point);
          } catch { /* Ignore malformed map messages. */ }
        }} />
    </View>
    {status ? <><Text style={ui.muted}>{status}</Text><Action secondary title="โหลดแผนที่ใหม่" onPress={() => { setStatus('กำลังโหลดแผนที่…'); setAttempt(value => value + 1); }} /></> : null}
  </View>;
}
