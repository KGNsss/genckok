import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { SvgName } from '@/theme/svg';
import { alpha, colors, radius, shadow, type } from '@/theme/theme';
import { Icon } from './Icon';
import { PressableScale } from './internal';

/** Kamera/QR üst çubuğundaki durum kapsülü: canlı nokta ("ping"), kamera ikonu, metin. */
export function CameraStatusPill({ text }: { text: string }) {
  const ping = useSharedValue(0);
  useEffect(() => {
    ping.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }), -1, false));
  }, [ping]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.75 * (1 - ping.value), transform: [{ scale: 1 + ping.value }] }));

  return (
    <View style={styles.pill}>
      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dot, styles.dotRing, ring]} />
        <View style={styles.dot} />
      </View>
      <Icon name="cameraSmall" size={14} />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

type GlassIconButtonProps = {
  icon: SvgName;
  variant: 'dark' | 'green';
  active?: boolean;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
};

/** dark: QR kapat (beyaz ikon) · green: kamera butonları (vine ikon). active: flaş açık. */
export function GlassIconButton({ icon, variant, active, onPress, size = 40, accessibilityLabel }: GlassIconButtonProps) {
  const dark = variant === 'dark';
  const base = dark
    ? { backgroundColor: alpha.black45, borderColor: alpha.white20 }
    : active
      ? { backgroundColor: alpha.forest45, borderColor: colors.vine, ...shadowGlow }
      : { backgroundColor: alpha.forest20, borderColor: alpha.forest35 };
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active }}
      style={[{ width: size, height: size, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, base]}
    >
      <Icon name={icon} size={20} color={dark ? colors.white : colors.vine} />
    </PressableScale>
  );
}

// flaş açıkken yeşil parıltı (iOS gölge vine, 7 px)
const shadowGlow = { shadowColor: colors.vine, shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 6 } as const;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: alpha.black50,
    borderWidth: 1,
    borderColor: alpha.vine50,
    overflow: 'hidden',
    ...shadow.camera,
  },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.vine },
  dotRing: { position: 'absolute' },
  pillText: { ...type.status, color: colors.onCamera },
});
