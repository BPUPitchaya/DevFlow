import { Tabs } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { useEffect } from 'react';

export default function TabLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      // Navigate to login
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => null,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
        }}
      />
      <Tabs.Screen
        name="standup"
        options={{
          title: 'Standup',
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
