import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { SVG, TAB_ICONS, TAB_ICON_SIZES, TAB_VINE_BACK } from '@/theme/svg';
import { colors, easing, motion, radius, shadow, size } from '@/theme/theme';

const LABELS = ['Fidanlarım', 'Tüm Fidanlar', 'Sıralama', 'QR Okuyucu', 'Kamera', 'Galeri'] as const;
const FULLSCREEN_ROUTES = ['qr', 'kamera'];
const B = size.tabButton; // 54

type WoodTabButtonProps = { index: number; selected: boolean; onPress: () => void; label?: string };

/** Tek odun dilimi sekme butonu (vitrin de bunu kullanır). index 0–5. */
export function WoodTabButton({ index, selected, onPress, label }: WoodTabButtonProps) {
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.set(withTiming(selected ? 1 : 0, { duration: motion.pageEnter, easing: Easing.bezier(...easing.out) }));
  }, [selected, sel]);

  const lift = useAnimatedStyle(() => ({
    opacity: 0.9 + 0.1 * sel.value,
    transform: [{ translateY: -2 * sel.value }, { scale: 1 + 0.1 * sel.value }],
  }));
  const ring = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scale: 0.9 + 0.1 * sel.value }] }));

  const Icon = TAB_ICONS[index];
  const iconSize = TAB_ICON_SIZES[index];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label ?? LABELS[index]}
      hitSlop={4}
    >
      <Animated.View style={[styles.btn, selected ? shadow.tabActive : shadow.tab, lift]}>
        {/* 0: arkadan yükselen sarmaşık (alta taşar) */}
        <SvgXml xml={TAB_VINE_BACK[index]} width={B} height={B * 1.4} style={styles.vineBack} />
        {/* 1: odun dilimi */}
        <SvgXml xml={SVG.tabWoodSlice} width={B} height={B} style={styles.abs} />
        {/* 5: ön sarmaşık */}
        <SvgXml xml={SVG.tabVineFront} width={56.7} height={B} style={styles.vineFront} />
        {/* 6: seçili çelenk */}
        <Animated.View pointerEvents="none" style={[styles.ring, ring]}>
          <SvgXml xml={SVG.tabVineRing} width={62} height={62} />
        </Animated.View>
        {/* 10: ikon */}
        <View pointerEvents="none" style={styles.iconWrap}>
          <SvgXml xml={Icon} width={iconSize} height={iconSize} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** Expo Router `Tabs` için özel sekme çubuğu. QR ve Kamera rotasında hiçbir şey çizmez. */
export function WoodTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index];
  if (FULLSCREEN_ROUTES.includes(focused.name)) return null;

  // `href: null` olan (sekme olmayan) rotalar çıkarılır. Expo Router bunu `tabBarItemStyle: { display: 'none' }` yapar.
  // Profilim açıkken hiçbir sekme seçili görünmez.
  const visible = state.routes.filter((r) => StyleSheet.flatten(descriptors[r.key]?.options.tabBarItemStyle)?.display !== 'none');

  return (
    <View style={[styles.bar, { paddingBottom: size.tabBarPadBottom + insets.bottom }]}>
      {visible.map((route, i) => {
        const selected = focused.key === route.key;
        return (
          <WoodTabButton
            key={route.key}
            index={i}
            selected={selected}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!selected && !e.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: size.tabBarPadX,
    paddingTop: size.tabBarPadTop,
  },
  btn: { width: B, height: B, borderRadius: radius.pill, backgroundColor: colors.wood, overflow: 'visible' },
  abs: { position: 'absolute', left: 0, top: 0 },
  // UI şablonu 8.2 katman tablosu
  vineBack: { position: 'absolute', left: 0, top: 0 },
  vineFront: { position: 'absolute', left: -1.35, top: 0 },
  ring: { position: 'absolute', left: -4, top: -4, width: 62, height: 62 },
  iconWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
