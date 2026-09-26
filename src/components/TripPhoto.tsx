import { useRef, useState } from 'react';
import { Image, Linking, Platform, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import PhotoCamera from './PhotoCamera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { filterPhoto } from '../services/photo-filter';
import { savePhoto } from '../services/save-photo';
import { FILTERS, type FilterId } from '../constants/photo-filters';
import { Action, Message, ui } from './JourneyUI';
export default function TripPhoto({ value, onChange, disabled, onBusyChange }: { value: string | null; onChange: (value: string | null) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [error, setError] = useState(''); const [settings, setSettings] = useState(false);
  const [busy, setBusy] = useState(false); const [original, setOriginal] = useState(''); const [filter, setFilter] = useState<FilterId>('normal');
  const lock = useRef(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saved, setSaved] = useState('');
  async function save() {
    if (!value || lock.current) return;
    lock.current = true; setBusy(true); onBusyChange(true); setError(''); setSaved(''); setSettings(false);
    try {
      if (!await savePhoto(value)) {
        setSettings(true);
        throw new Error('กรุณาเปิดสิทธิ์บันทึกรูปในการตั้งค่า แล้วลองบันทึกอีกครั้ง');
      }
      setSaved('บันทึกรูปลงคลังภาพแล้ว');
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกรูปไม่ได้ กรุณาลองใหม่'); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  async function prepare(asset: { uri: string; width: number; height: number; fileSize?: number }) {
    setSaved('');
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) throw new Error('เลือกไฟล์ภาพไม่เกิน 10 MB');
    const resized = await manipulateAsync(asset.uri, [{ resize: asset.width >= asset.height ? { width: Math.min(1280, asset.width) } : { height: Math.min(1280, asset.height) } }], { compress: .8, format: SaveFormat.JPEG, base64: true });
    if (!resized.base64 || resized.base64.length > 2_800_000) throw new Error('ภาพหลังย่อใหญ่เกิน 2 MB กรุณาเลือกภาพอื่น');
    setOriginal(resized.base64); setFilter('normal'); onChange('data:image/jpeg;base64,' + resized.base64);
  }
  async function pick(camera: boolean) {
    if (lock.current) return; lock.current = true;  setBusy(true); onBusyChange(true); setError(''); setSettings(false);
    try {
      if (camera) {
        const permission = await Camera.requestCameraPermissionsAsync();
        if (!permission.granted) { setSettings(!permission.canAskAgain); throw new Error('ไม่ได้รับสิทธิ์กล้อง คุณยังเลือกภาพจากคลังหรือบันทึกโดยไม่มีรูปได้'); }
        setCameraOpen(true); return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .85, allowsEditing: true, aspect: [4, 3] });
      if (result.canceled) return;
      await prepare(result.assets[0]);
    } catch (e) { setError(e instanceof Error ? e.message : 'เลือกภาพไม่ได้'); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  async function apply(id: FilterId) {
    setSaved('');
    if (lock.current) return; lock.current = true; setBusy(true); onBusyChange(true); setError('');
    try { const next = await filterPhoto(original, id); if (next.length > 2_800_000) throw new Error('ภาพใหญ่เกิน 2 MB'); onChange(next); setFilter(id); }
    catch (e) { setError(e instanceof Error ? e.message : 'ปรับภาพไม่ได้'); } finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  return <View style={ui.card}><Text style={ui.heading}>ภาพความทรงจำ (ไม่บังคับ)</Text>{value && <Image accessibilityLabel="ตัวอย่างภาพที่จะส่ง" source={{ uri: value }} style={ui.photo} resizeMode="contain" />}<Action secondary title="ถ่ายรูป" disabled={disabled || busy} onPress={() => void pick(true)} /><Action secondary title={busy ? 'กำลังเตรียมภาพ…' : value ? 'เปลี่ยนภาพจากคลัง' : 'เลือกจากคลัง'} disabled={disabled || busy} onPress={() => void pick(false)} />{value && <><View style={ui.row}>{FILTERS.map(f => <Action key={f.id} secondary title={`${filter === f.id ? '✓ ' : ''}${f.label}`} disabled={disabled || busy || !original} onPress={() => void apply(f.id)} />)}</View><Action secondary title="บันทึกรูปลงเครื่อง" disabled={disabled || busy} onPress={() => void save()} /><Action secondary title="นำรูปออก" disabled={disabled || busy} onPress={() => { onChange(null); setOriginal(''); setSaved(''); }} /></>}<Message text={error} />{saved ? <Text accessibilityLiveRegion="polite" style={ui.text}>{saved}</Text> : null}{settings && Platform.OS !== 'web' && <Action title="เปิดการตั้งค่าสิทธิ์" onPress={() => void Linking.openSettings().catch(() => setError('เปิดการตั้งค่าไม่ได้'))} />}<Text style={ui.muted}>ใช้กล้องเมื่อคุณกดถ่ายรูปเท่านั้น ภาพจะถูกย่อก่อนใช้งาน</Text>{cameraOpen && <PhotoCamera onCapture={prepare} onClose={() => setCameraOpen(false)} />}</View>;
}
