// Kök layout: fontlar, sağlayıcılar, oturuma göre yönlendirme. Sahibi: Görev 1.
import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components';
import { AuthProvider, useSession } from '@/lib/auth';
import { colors } from '@/theme/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

/** Uygulama ön plana gelince sorgular yenilensin (refetchOnWindowFocus mobilde çalışmaz). */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}

const PENDING_QR_KEY = 'gk_pending_qr';
/** Oturum yokken de açılabilen rota grupları. `dev` sadece geliştirmede (bileşen vitrini). */
const OPEN_ROUTES = ['(auth)', 'sifre-yenile'];

/** Oturum durumuna göre giriş ekranına / uygulamaya yönlendirir. */
function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments() as string[];
  const router = useRouter();
  const { code } = useGlobalSearchParams<{ code?: string }>();

  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const inOpen = OPEN_ROUTES.includes(first) || (__DEV__ && first === 'dev');

    if (!session && !inOpen) {
      // Künye linkinden gelindiyse kodu sakla; girişten sonra o fidana dönülür
      if (first === 't' && code) AsyncStorage.setItem(PENDING_QR_KEY, String(code)).catch(() => {});
      router.replace('/(auth)/giris');
    } else if (session && first === '(auth)') {
      AsyncStorage.getItem(PENDING_QR_KEY)
        .then(async (pending) => {
          if (pending) {
            await AsyncStorage.removeItem(PENDING_QR_KEY);
            router.replace({ pathname: '/t/[code]', params: { code: pending } });
          } else {
            router.replace('/(app)');
          }
        })
        .catch(() => router.replace('/(app)'));
    }
  }, [session, loading, segments, code, router]);

  return null;
}

function Root() {
  const { loading } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    AgravePro: require('../../assets/fonts/AgravePro-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const ready = (fontsLoaded || !!fontError) && !loading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <Root />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
