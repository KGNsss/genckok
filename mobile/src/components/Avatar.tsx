import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { alpha, colors, radius, shadow, size as sizes } from '@/theme/theme';
import { Icon } from './Icon';
import { PressableScale, resolveAvatarUri } from './internal';

type AvatarSize = 'header' | 'large' | 'paper' | 'mini';
type AvatarProps = { path: string | null; size: AvatarSize; onPress?: () => void; accessibilityLabel?: string };

// UI şablonu 8.11
const SPEC: Record<AvatarSize, { d: number; border: number; borderColor: string; icon: number; iconColor: string; shadow?: ViewStyle }> = {
  header: { d: sizes.headerIcon, border: 1, borderColor: alpha.vine75, icon: 22, iconColor: colors.vine },
  large:  { d: sizes.avatarLg,   border: 3, borderColor: alpha.vine80, icon: 80, iconColor: colors.vine, shadow: shadow.avatar },
  paper:  { d: sizes.avatarMd,   border: 2, borderColor: alpha.forest45, icon: 44, iconColor: colors.forest, shadow: shadow.avatar },
  mini:   { d: sizes.avatarXs,   border: 1, borderColor: alpha.forest45, icon: 16, iconColor: colors.forest, shadow: shadow.chip },
};

export function Avatar({ path, size, onPress, accessibilityLabel }: AvatarProps) {
  const s = SPEC[size];
  const uri = resolveAvatarUri(path);
  const body = (
    <View style={[{ width: s.d, height: s.d, borderRadius: radius.pill }, s.shadow]}>
      <View style={[styles.clip, { borderRadius: radius.pill, borderWidth: s.border, borderColor: s.borderColor }]}>
        {uri ? <Image source={uri} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} /> : <Icon name="userIcon" size={s.icon} color={s.iconColor} />}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Profil'}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha.forest15 },
});
