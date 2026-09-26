import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { TripsProvider } from '../src/contexts/TripsContext';
export default function Layout() {
  return <SafeAreaProvider><AuthProvider><TripsProvider><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: '#F8F9FA' }, headerTintColor: '#1D3557', headerShadowVisible: false, contentStyle: { backgroundColor: '#F8F9FA' } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ title: 'บัญชี TravelDiary' }} /><Stack.Screen name="trip/[id]" options={{ title: 'ความทรงจำของฉัน' }} /><Stack.Screen name="edit/[id]" options={{ title: 'แก้ไขบันทึก' }} /></Stack></TripsProvider></AuthProvider></SafeAreaProvider>;
}
