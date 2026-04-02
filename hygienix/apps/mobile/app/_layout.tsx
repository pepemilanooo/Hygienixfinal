import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="interventions/[id]/index"
          options={{
            headerShown: true,
            headerTitle: 'Dettaglio Intervento',
            headerTintColor: '#16a34a',
            headerBackTitle: 'Indietro',
          }}
        />
        <Stack.Screen
          name="interventions/[id]/card"
          options={{
            headerShown: true,
            headerTitle: 'Cartellino Sito',
            headerTintColor: '#16a34a',
            headerBackTitle: 'Indietro',
          }}
        />
        <Stack.Screen
          name="interventions/[id]/work"
          options={{
            headerShown: true,
            headerTitle: 'Lavori Eseguiti',
            headerTintColor: '#16a34a',
            headerBackTitle: 'Indietro',
          }}
        />
        <Stack.Screen
          name="interventions/[id]/close"
          options={{
            headerShown: true,
            headerTitle: 'Chiusura Intervento',
            headerTintColor: '#16a34a',
            headerBackTitle: 'Indietro',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
