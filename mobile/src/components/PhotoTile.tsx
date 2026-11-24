import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { PhotoStatus } from '@/api/types';
import { alpha, colors, radius, shadow } from '@/theme/theme';
import { PhotoStatusBadge } from './Badges';
import { PressableScale, resolvePhotoUri } from './internal';

type PhotoTileProps = {
  path: string | null;
  /** Verilmezse bulunduğu sütunu doldurur (aspectRatio 1). */
  size?: number;
  /** 'beklemede' / 'reddedildi' ise fotoğraf soluk çizilir ve sol altta rozet çıkar. */
  status?: PhotoStatus;
  onPress?: () => void;
};

export function PhotoTile({ path, size, status = 'onaylandi', onPress }: PhotoTileProps) {
  const uri = resolvePhotoUri(path);
  const dim = status !== 'onaylandi';
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="imagebutton"
      accessibilityLabel="Fotoğraf"
      style={[size ? { width: size, height: size } : { width: '100%', aspectRatio: 1 }, styles.shadow]}
    >
      <View style={styles.clip}>
        {uri ? (
          <Image source={uri} contentFit="cover" transition={150} style={[StyleSheet.absoluteFill, dim && styles.dim]} />
        ) : null}
        {dim && (
          <View style={styles.badge}>
            <PhotoStatusBadge status={status} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.card, ...shadow.card },
  clip: {
    flex: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.cardBlue,
    borderWidth: 1,
    borderColor: alpha.vine35,
  },
  dim: { opacity: 0.7 },
  badge: { position: 'absolute', left: 6, right: 6, bottom: 6, alignItems: 'flex-start' },
});
