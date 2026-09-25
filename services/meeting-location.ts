import * as Location from 'expo-location';
import type { Venue } from '../types/event';

export class LocationPermissionError extends Error {
  constructor(public openSettings: boolean) {
    super('ไม่ได้รับสิทธิ์ตำแหน่ง เลือกจุดบนแผนที่หรือกรอกพิกัดเองได้');
  }
}
export async function getMeetingLocation(): Promise<Venue> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new LocationPermissionError(!permission.canAskAgain);
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { name: 'ตำแหน่งปัจจุบัน', latitude: coords.latitude, longitude: coords.longitude };
}
