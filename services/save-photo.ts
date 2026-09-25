import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
// Expo Go on the test device provides ExpoMediaLibrary, not ExpoMediaLibraryNext.
import { saveToLibraryAsync, requestPermissionsAsync } from 'expo-media-library/legacy';

export async function savePhoto(dataUri: string): Promise<boolean> {
  // Android 13+ saves new images without storage permission. Expo Go rejects
  // the permission request itself, even with writeOnly enabled.
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
    const permission = await requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) {
      if (!permission.canAskAgain) return false;
      throw new Error('ยังไม่ได้รับสิทธิ์บันทึกรูป กรุณากดบันทึกอีกครั้งเพื่ออนุญาต');
    }
  }
  const file = new File(Paths.cache, `pokejourney-${Date.now()}.jpg`);
  try {
    file.write(dataUri.split(',')[1], { encoding: 'base64' });
    await saveToLibraryAsync(file.uri);
  } finally {
    // A cache cleanup failure must not report a successfully saved photo as failed.
    try { if (file.exists) file.delete(); } catch {}
  }
  return true;
}
