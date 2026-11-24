import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSegments } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { AppHeader, ScreenErrorBoundary, WoodTabBar } from '@/components';
import { ModalProvider } from '@/modal/ModalHost';
import { colors } from '@/theme/theme';

/** Uygulamanın iskeleti: üst bar + 6 odun dilimli sekme çubuğu + çizgili kağıt (modal) katmanı. Sahibi: Görev 0. */
export default function AppLayout() {
  const segments = useSegments() as string[];
  const last = segments[segments.length - 1];
  const isFullScreen = last === 'qr' || last === 'kamera';

  return (
    <ModalProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style={isFullScreen ? 'light' : 'dark'} />
        {!isFullScreen && <AppHeader />}
        <Tabs
          tabBar={(p) => <WoodTabBar {...p} />}
          screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
          screenLayout={({ children }) => <ScreenErrorBoundary>{children}</ScreenErrorBoundary>}
        >
          <Tabs.Screen name="index" />          {/* 1 Fidanlarım */}
          <Tabs.Screen name="tum-fidanlar" />   {/* 2 Tüm Fidanlar */}
          <Tabs.Screen name="siralama" />       {/* 3 Sıralama */}
          <Tabs.Screen name="qr" />             {/* 4 QR (tam ekran) */}
          <Tabs.Screen name="kamera" />         {/* 5 Kamera (tam ekran) */}
          <Tabs.Screen name="galeri" />         {/* 6 Galeri */}
          <Tabs.Screen name="profilim" options={{ href: null }} />  {/* sekme değil: üst bardaki profil butonu */}
        </Tabs>
      </View>
    </ModalProvider>
  );
}
