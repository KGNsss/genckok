import { Component, useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, fonts, radius } from '@/theme/theme';

type PulseBoxProps = { width: DimensionValue; height: DimensionValue; radius?: number };

/** Yükleniyor iskeleti: `cardBlue` zemin, opaklık 0.5 ↔ 1, 900 ms (yükleme göstergesi olduğu için sonsuz döngü serbest). */
export function PulseBox({ width, height, radius: r = radius.card }: PulseBoxProps) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.cardBlue }, anim]} />;
}

/** Liste boşken / hata olunca kapsülün altında çıkan kısa not. */
export function EmptyNote({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13, // UI şablonu 8.17: EmptyNote = Inter 500 13 (theme'de karşılığı yok)
    lineHeight: 18,
    color: colors.inkMuted,
  },
});

/**
 * Bir ekran çizilirken hata verirse (ör. sahibi henüz doldurmadığı için dosyası boşsa) uygulamanın tamamı çökmesin,
 * sadece o sekmede kısa bir not görünsün. (app)/_layout her sekme ekranını bununla sarar.
 */
export class ScreenErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    if (__DEV__) console.warn('[GençKök] Ekran çizilemedi (dosya boş ya da hatalı olabilir):', error.message);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <EmptyNote text="Bu ekran henüz hazır değil." />
      </View>
    );
  }
}

/** Sahibi henüz yazmamış ekranların yer tutucusu: route dosyaları bunu dışa aktarır, sahibi dosyayı tamamen değiştirir. */
export function ScreenPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: colors.bg }}>
      <EmptyNote text="Bu ekran henüz hazır değil." />
    </View>
  );
}
