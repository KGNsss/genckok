import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SVG } from '@/theme/svg';
import { colors, shadow, size, type } from '@/theme/theme';
import { diacriticRoom } from './internal';

/** Sayfa başlığı: sol kenara yapışık, sağ ucu ok şeklinde post-it etiketi. */
export function PostItTitle({ text }: { text: string }) {
  return (
    <View pointerEvents="none" style={[styles.wrap, shadow.postIt]} accessibilityRole="header">
      <SvgXml xml={SVG.postItArrow} width="100%" height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} />
      <Text style={[styles.text, diacriticRoom]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: size.postItTop,
    left: 0,
    zIndex: 5,
    paddingLeft: 16,
    paddingRight: 32,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  text: { ...type.pageTitle, color: colors.ink },
});
