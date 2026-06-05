import { Stack } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { useEffect } from 'react';

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      // Navigate to tabs
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
