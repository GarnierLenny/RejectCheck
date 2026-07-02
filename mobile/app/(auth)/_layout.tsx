import { Stack } from 'expo-router';
import { RC } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: RC.bg },
      }}
    />
  );
}
