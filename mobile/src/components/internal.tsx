// G0 iç yardımcıları: dışarıya `index.ts` üzerinden AÇILMAZ, sadece components/* kullanır.
import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { avatarUrl, photoUrl } from '@/lib/format';
import { motion, pressed } from '@/theme/theme';

/** Storage yolu ya da tam adres → gösterilecek adres. Tam adres (http…) verilirse olduğu gibi kullanılır (vitrin için). */
export function resolvePhotoUri(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^(https?:|file:|data:)/.test(path) ? path : photoUrl(path);
}

export function resolveAvatarUri(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^(https?:|file:|data:)/.test(path) ? path : avatarUrl(path);
}

/**
 * Agrave Pro (el yazısı) büyük harflerde Ö Ğ İ Ü gibi işaretleri satır kutusunun üstüne taşırır; tek satırlık
 * metinlerde (numberOfLines=1) bu işaretler kırpılabiliyor. Üstte pay bırakıp aynı miktarda geri çekeriz: yerleşim değişmez.
 */
export const diacriticRoom = { paddingTop: 4, marginTop: -4 } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Basılıyken eklenen stil (ör. koyulaşan zemin). */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Basılıyken ölçek; varsayılan `pressed.scale` (0.95). */
  scaleTo?: number;
};

/** Basılınca `motion.tab` (150 ms) sürede küçülen Pressable. Tüm dokunulabilir bileşenler bunu kullanır. */
export function PressableScale({ style, pressedStyle, scaleTo = pressed.scale, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const [down, setDown] = useState(false);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        setDown(true);
        scale.set(withTiming(scaleTo, { duration: motion.tab }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        scale.set(withTiming(1, { duration: motion.tab }));
        onPressOut?.(e);
      }}
      style={[style, down ? pressedStyle : null, anim]}
    />
  );
}
