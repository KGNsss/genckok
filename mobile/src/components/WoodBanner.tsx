import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, shadow, size } from '@/theme/theme';
import { SVG } from '@/theme/svg';

type WoodBannerProps = {
  variant: 'grain' | 'plain';
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// UI şablonu 8.10: tasarımdaki sabit renkli iç çizgiler (theme'de karşılığı yok)
const EDGE = 'rgba(142,93,50,0.65)';
const HIGHLIGHT = 'rgba(255,235,210,0.35)';
const INNER_SHADOW = 'rgba(92,54,22,0.28)';

/** Ahşap tabela. grain = Sayfa 1 "GÜNÜN SÖZÜ" (44 px, dokulu) · plain = Sayfa 3 bandı (düz, iç boşluk 20 / 14). */
export function WoodBanner({ variant, children, style }: WoodBannerProps) {
  if (variant === 'plain') {
    return <View style={[styles.plain, style]}>{children}</View>;
  }
  return (
    <View style={[styles.grain, shadow.card, style]}>
      <SvgXml xml={SVG.woodBannerGrain} width="100%" height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.top} />
      <View pointerEvents="none" style={styles.bottom} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  plain: { width: '100%', backgroundColor: colors.wood, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  grain: {
    width: '100%',
    height: size.woodBannerH,
    backgroundColor: colors.wood,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: EDGE,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: HIGHLIGHT },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: INNER_SHADOW },
  content: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
