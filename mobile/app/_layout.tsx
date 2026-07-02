import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { RC } from '@/theme';

export { ErrorBoundary } from 'expo-router';

/** Redirects between the (auth) and (tabs) groups based on the Supabase session.
 *  The canonical Expo Router auth-gate pattern. */
function RootNav() {
  const { session, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) router.replace('/(auth)/login');
    else if (session && inAuth) router.replace('/(tabs)');
  }, [session, initializing, segments, router]);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: RC.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={RC.red} />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
