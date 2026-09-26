import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { CameraView, type CameraType, type CameraCapturedPicture } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, Message, ui } from './JourneyUI';

export default function PhotoCamera({ onCapture, onClose }: {
  onCapture: (photo: CameraCapturedPicture) => Promise<void>;
  onClose: () => void;
}) {
  const camera = useRef<CameraView>(null);
  const lock = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function capture() {
    if (!ready || lock.current || !camera.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const photo = await camera.current.takePictureAsync({ quality: .85 });
      if (!photo) throw new Error('ถ่ายรูปไม่สำเร็จ กรุณาลองใหม่');
      await onCapture(photo);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'ถ่ายรูปไม่ได้'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal visible animationType="none" onRequestClose={() => { if (!lock.current) onClose(); }}>
    <SafeAreaView style={[ui.page, { flex: 1, padding: 16, gap: 12 }]}>
      <Text style={ui.heading}>ถ่ายภาพความทรงจำ</Text>
      <View style={{ flex: 1, overflow: 'hidden', borderRadius: 20, backgroundColor: '#000' }}>
        <CameraView key={facing} ref={camera} style={{ flex: 1 }} facing={facing}
          onCameraReady={() => setReady(true)}
          onMountError={() => { setReady(false); setError('เปิดกล้องไม่ได้ กรุณาปิดแล้วลองใหม่ หรือเลือกภาพจากคลัง'); }} />
      </View>
      <Message text={error} />
      <Action title={busy ? 'กำลังเตรียมภาพ…' : 'ถ่ายรูป'} disabled={!ready || busy} onPress={() => void capture()} />
      <Action secondary title="สลับกล้องหน้า / หลัง" disabled={busy} onPress={() => { setReady(false); setError(''); setFacing(facing === 'back' ? 'front' : 'back'); }} />
      <Action secondary title="ยกเลิก" disabled={busy} onPress={onClose} />
    </SafeAreaView>
  </Modal>;
}
