import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

interface TabBarIconProps {
  color: string;
  size: number;
}

export default function GuideTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4fe0be',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: '#23a08d',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Ionicons name="grid-outline" size={size} color={color} />,
          headerTitle: 'Guide Dashboard',
        }}
      />
      <Tabs.Screen
        name="certifications"
        options={{
          title: 'Certifications',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Ionicons name="ribbon-outline" size={size} color={color} />,
          headerTitle: 'My Certifications',
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Ionicons name="notifications-outline" size={size} color={color} />,
          headerTitle: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="identification"
        options={{
          title: 'Identification',//for plant identification
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Ionicons name="leaf-outline" size={size} color={color} />,
          headerTitle: 'Plant Identification',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Ionicons name="person-outline" size={size} color={color} />,
          headerTitle: 'Guide Profile',
        }}
      />
      {/* <Tabs.Screen
        name="progressDetails"
        options={{
          tabBarButton: () => null,
          headerTitle: 'Certificate Progress',
        }}
      />
      <Tabs.Screen
        name="topic"
        options={{
          tabBarButton: () => null,
          headerTitle: 'Topic',
        }}
      /> */}
    </Tabs>
  );
} 