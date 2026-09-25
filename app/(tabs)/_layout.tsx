import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
export default function Layout() {
  const { fontScale } = useWindowDimensions();
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#F5F2E9' }, headerTintColor: '#183F38', headerShadowVisible: false, tabBarActiveTintColor: '#21584B', tabBarInactiveTintColor: '#5C6963', tabBarStyle: { minHeight: 64 + Math.max(0,fontScale-1)*24 }, tabBarLabelStyle: { fontSize: 12 } }}>
    <Tabs.Screen name="index" options={{ title: 'บันทึกของฉัน', tabBarIcon: ({color}) => <Ionicons accessible={false} name="book-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="add" options={{ title: 'เพิ่มทริป', tabBarIcon: ({color}) => <Ionicons accessible={false} name="add-circle-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="map" options={{ title: 'แผนที่', tabBarIcon: ({color}) => <Ionicons accessible={false} name="map-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: ({color}) => <Ionicons accessible={false} name="person-outline" size={24} color={color} /> }} />
  </Tabs>;
}
