import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { trUpper } from '@/lib/format';
import { alpha, colors, radius, shadow, size } from '@/theme/theme';
import { Capsule } from './Capsule';
import { PressableScale, resolvePhotoUri } from './internal';

type SaplingCardProps = {
  label: string;
  coverPath: string | null;
  size: 'lg' | 'sm';
  onPress?: () => void;
};

/** lg: 176×264 (Sayfa 1 deste) · sm: 78×116 (Sayfa 2 ızgara). Altında büyük harfli ad kapsülü. */
export function SaplingCard({ label, coverPath, size: sz, onPress }: SaplingCardProps) {
  const lg = sz === 'lg';
  const w = lg ? size.cardLgW : size.cardSmW;
  const h = lg ? size.cardLgH : size.cardSmH;
  const r = lg ? radius.cardLg : radius.card;
  const uri = resolvePhotoUri(coverPath);
  const name = trUpper(label);

  return (
    <PressableScale onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={name} style={styles.col}>
      {/* gölge dışta, kırpma içte: iOS'ta overflow:hidden gölgeyi keser */}
      <View style={[{ width: w, height: h, borderRadius: r }, lg ? shadow.cardLg : shadow.card]}>
        <View style={[styles.clip, { borderRadius: r }]}>
          {uri ? <Image source={uri} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} /> : null}
        </View>
      </View>
      <View style={{ marginTop: lg ? 10 : 4 }}>
        <Capsule variant={lg ? 'title' : 'name'} text={name} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center' },
  clip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.cardBlue,
    borderWidth: 1,
    borderColor: alpha.vine35,
  },
});
