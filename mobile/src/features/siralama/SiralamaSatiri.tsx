// Sıralama satırı (Sayfa 3): sıra, avatar, ad, rozetler, puan. Madalya/kupa/ikon yok. Sahibi: Görev 9.
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import type { LeaderboardRow } from '@/api/types';
import { Avatar, Capsule, RoleChip, diacriticRoom } from '@/components';
// SORU: PressableScale '@/components' index'inden dışa aktarılmıyor; G0 index'e eklemeli mi?
import { PressableScale } from '@/components/internal';
import { alpha, colors, easing, motion, radius, shadow, type } from '@/theme/theme';

type SiralamaSatiriProps = {
  row: LeaderboardRow;
  onPress: () => void;
  /** Listedeki sıra; giriş animasyonunun gecikmesi için. */
  index: number;
  /** Sadece ilk yüklemede true; sonraki yenilemelerde animasyon oynamaz. */
  animate: boolean;
};

const ANIMATED_ROWS = 8;
const STAGGER_MS = 50;

export default function SiralamaSatiri({ row, onPress, index, animate }: SiralamaSatiriProps) {
  const shouldAnimate = animate && index < ANIMATED_ROWS;
  const p = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) return;
    p.set(withDelay(index * STAGGER_MS, withTiming(1, { duration: motion.pageEnter, easing: Easing.bezier(...easing.out) })));
  }, [shouldAnimate, index, p]);

  const enter = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 4 }] }));

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={enter}>
      <PressableScale
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${row.rank}. sıra, ${row.full_name}, ${row.total_points} puan`}
        style={[
          styles.row,
          {
            backgroundColor: row.rank <= 3 ? alpha.forest20 : alpha.forest10,
            borderColor: row.is_me ? colors.vine : 'transparent',
          },
        ]}
      >
        <Text style={[type.paperLabel, styles.rank, row.rank >= 100 && styles.rankWide, diacriticRoom]} numberOfLines={1}>
          {row.rank}
        </Text>
        <Avatar path={row.avatar_path} size="mini" />
        <Text style={[type.capsule, styles.name, diacriticRoom]} numberOfLines={1} ellipsizeMode="tail">
          {row.full_name}
        </Text>
        {row.is_me || row.role === 'gonullu' ? (
          <View style={styles.badges}>
            {row.is_me ? <Capsule variant="chipSmall" text="SEN" style={styles.meChip} /> : null}
            <RoleChip role={row.role} />
          </View>
        ) : null}
        <View style={styles.points}>
          <Text style={styles.pointsValue}>{String(row.total_points)}</Text>
          <Text style={styles.pointsUnit}>puan</Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1, // kendi satırın 1 px vine çerçevesi; diğerlerinde şeffaf, yükseklik eşit kalsın
    ...shadow.capsule,
  },
  rank: { width: 24, textAlign: 'center', color: colors.ink },
  rankWide: { width: 28 },
  name: { flex: 1, color: colors.ink },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meChip: { backgroundColor: alpha.vine25 },
  points: { flexDirection: 'row', alignItems: 'baseline' },
  pointsValue: { ...type.valueBold, color: colors.inkMuted },
  pointsUnit: { ...type.tiny, color: colors.inkMuted, marginLeft: 4 },
});
