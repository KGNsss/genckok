import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { alpha, colors, radius, shadow, type } from '@/theme/theme';
import { PressableScale, diacriticRoom } from './internal';

export type CapsuleVariant = 'title' | 'name' | 'chip' | 'chipSmall' | 'row' | 'rowSmall';

type CapsuleProps = {
  text?: string;
  variant?: CapsuleVariant;
  onPress?: () => void;
  /** 'row' / 'rowSmall' için: <CapsuleLabel/> + değer */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// UI şablonu 8.5: varyant tablosu (iç boşluk yatay / dikey, yazı, gölge, zemin)
const VARIANTS: Record<CapsuleVariant, { px: number; py: number; text?: TextStyle; shadow: ViewStyle; bg: string; pressedBg: string }> = {
  title:     { px: 16, py: 6, text: type.capsule,       shadow: shadow.capsule, bg: alpha.forest10, pressedBg: alpha.forest20 },
  name:      { px: 10, py: 2, text: type.cardNameSmall, shadow: shadow.chip,    bg: alpha.forest10, pressedBg: alpha.forest20 },
  chip:      { px: 12, py: 4, text: type.chip,          shadow: shadow.chip,    bg: alpha.forest10, pressedBg: alpha.forest20 },
  chipSmall: { px: 10, py: 4, text: type.chipSmall,     shadow: shadow.chip,    bg: alpha.forest15, pressedBg: alpha.forest25 },
  row:       { px: 20, py: 8,                           shadow: shadow.capsule, bg: alpha.forest10, pressedBg: alpha.forest10 },
  rowSmall:  { px: 16, py: 6,                           shadow: shadow.chip,    bg: alpha.forest15, pressedBg: alpha.forest15 },
};

export function Capsule({ text, variant = 'title', onPress, children, style, accessibilityLabel }: CapsuleProps) {
  const v = VARIANTS[variant];
  const isRow = variant === 'row' || variant === 'rowSmall';
  const base: ViewStyle = {
    paddingHorizontal: v.px,
    paddingVertical: v.py,
    borderRadius: radius.pill,
    backgroundColor: v.bg,
    ...v.shadow,
    ...(isRow ? { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 } : { alignItems: 'center', justifyContent: 'center' }),
  };
  const content = isRow ? children : <Text style={[v.text, styles.ink, diacriticRoom]} numberOfLines={1}>{text}</Text>;

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? text}
        style={[base, style]}
        pressedStyle={{ backgroundColor: v.pressedBg }}
      >
        {content}
      </PressableScale>
    );
  }
  return <View style={[base, style]}>{content}</View>;
}

/** "İsim Soyisim:" gibi etiket; sonuna ':' kendisi koyar. */
export function CapsuleLabel({ text, small }: { text: string; small?: boolean }) {
  return <Text style={[small ? type.publicLabel : type.profileLabel, styles.ink, diacriticRoom]}>{`${text}:`}</Text>;
}

const styles = StyleSheet.create({
  ink: { color: colors.ink },
});
