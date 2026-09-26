import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
export default function Layout() {
  const { fontScale } = useWindowDimensions();
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#F8F9FA' }, headerTintColor: '#1D3557', headerShadowVisible: false, tabBarActiveTintColor: '#1D3557', tabBarInactiveTintColor: '#617084', tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#DEE4E9', paddingTop: 8, minHeight: 72 + Math.max(0,fontScale-1)*24 }, tabBarLabelStyle: { fontSize: 12 } }}>
    <Tabs.Screen name="index" options={{ title: 'บันทึกของฉัน', tabBarIcon: ({color}) => <Ionicons accessible={false} name="book-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="add" options={{ title: 'เพิ่มทริป', tabBarIcon: ({color}) => <Ionicons accessible={false} name="add-circle-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="map" options={{ title: 'แผนที่', tabBarIcon: ({color}) => <Ionicons accessible={false} name="map-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: ({color}) => <Ionicons accessible={false} name="person-outline" size={24} color={color} /> }} />
  </Tabs>;
}
