import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { alpha, colors, radius, shadow, type } from '@/theme/theme';
import { PressableScale, diacriticRoom } from './internal';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  size: 'md';
  loading?: boolean;
  disabled?: boolean;
};

/** Ana buton: "EKLE", "ONAYLA", "GİRİŞ". loading iken yazı soluk, ortada döner gösterge, basılamaz. */
export function PillButton({ label, onPress, loading, disabled }: PillButtonProps) {
  const blocked = !!loading || !!disabled;
  return (
    <PressableScale
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: !!loading }}
      style={[styles.btn, disabled && !loading && styles.disabled]}
      pressedStyle={{ backgroundColor: alpha.forest30 }}
    >
      <Text style={[styles.label, diacriticRoom, loading && styles.labelLoading]}>{label}</Text>
      {loading && (
        <View style={styles.spinner}>
          <ActivityIndicator size="small" color={colors.forest} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // UI şablonu 8.9 md: iç boşluk 36 / 10
  btn: {
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest20,
    borderWidth: 1,
    borderColor: alpha.forest45,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  disabled: { opacity: 0.4 },
  label: { ...type.paperLabel, color: colors.ink, letterSpacing: 1 },
  labelLoading: { opacity: 0.4 },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
