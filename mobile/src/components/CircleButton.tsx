import { alpha, radius } from '@/theme/theme';
import { Icon } from './Icon';
import { PressableScale } from './internal';

type CircleButtonProps = {
  icon: 'plus';
  size: 50 | 40;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Zemin forest20 (basılıyken forest30), içinde sarmaşık yeşili artı. */
export function CircleButton({ icon, size, onPress, disabled, accessibilityLabel }: CircleButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Fidan Ekle'}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha.forest20,
        opacity: disabled ? 0.4 : 1,
      }}
      pressedStyle={{ backgroundColor: alpha.forest30 }}
    >
      <Icon name={icon} size={size === 50 ? 24 : 20} />
    </PressableScale>
  );
}
