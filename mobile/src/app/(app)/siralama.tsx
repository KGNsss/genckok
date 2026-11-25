// Sayfa 3 - Sıralama (puan yarışı; ödül yok, sadece sıra, ad ve puan). Sahibi: Görev 9.
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LEADERBOARD_LIMIT, useLeaderboard } from '@/api/leaderboard';
import { useMe } from '@/api/me';
import type { LeaderboardRow } from '@/api/types';
import { Capsule, EmptyNote, PageScreen, PulseBox, WoodBanner } from '@/components';
import SiralamaSatiri from '@/features/siralama/SiralamaSatiri';
import { toMessage } from '@/lib/errors';
import { useModal } from '@/modal';
import { colors, motion, pageTop, radius, size, type } from '@/theme/theme';

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
const ENTRANCE_WINDOW_MS = 8 * 50 + motion.pageEnter + 100;

export default function SiralamaScreen() {
  const modal = useModal();
  const { data, isLoading, isError, error, refetch } = useLeaderboard();
  const { data: me } = useMe();
  const [refreshing, setRefreshing] = useState(false);
  const [animateEntrance, setAnimateEntrance] = useState(true);

  const rows: LeaderboardRow[] = data ?? [];

  // Giriş animasyonu sadece ilk yüklemede oynar: veri gelince pencere (8 satır × 50 ms + 200 ms) bitince kapanır.
  const hasData = data !== undefined;
  useEffect(() => {
    if (!hasData) return;
    const t = setTimeout(() => setAnimateEntrance(false), ENTRANCE_WINDOW_MS);
    return () => clearTimeout(t);
  }, [hasData]);

  // Sekmeye her gelişte sessiz yenileme (spinner göstermez).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const hasMeRow = rows.some((r) => r.is_me);
  const lastIndex = rows.length - 1;

  const renderItem = ({ item, index }: { item: LeaderboardRow; index: number }) => {
    // Kendi satırın ilk 50'nin dışında olup sona eklendiyse öncesine üç nokta
    const showGap = item.is_me && index === lastIndex && item.rank > LEADERBOARD_LIMIT;
    return (
      <View>
        {showGap ? (
          <Text style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
            ···
          </Text>
        ) : null}
        <SiralamaSatiri
          row={item}
          index={index}
          animate={animateEntrance}
          onPress={() => modal.open({ name: 'kullanici-profili', userId: item.user_id })}
        />
      </View>
    );
  };

  const header = (
    <View>
      <WoodBanner variant="plain" style={styles.banner}>
        <Text style={styles.bannerText}>Fidan ekleyerek ve fotoğraf paylaşarak puan topla, ormandaki yerini gör.</Text>
      </WoodBanner>
      <View style={styles.afterBanner} />
    </View>
  );

  let empty: ReactElement;
  if (isLoading) {
    empty = (
      <View style={styles.skeletons}>
        {SKELETON_ROWS.map((i) => (
          <PulseBox key={i} width="100%" height={44} radius={radius.pill} />
        ))}
      </View>
    );
  } else if (isError) {
    empty = (
      <View style={styles.errorBox}>
        <EmptyNote text={toMessage(error)} />
        <Capsule variant="chip" text="Tekrar dene" onPress={() => refetch()} />
      </View>
    );
  } else {
    empty = <EmptyNote text="Henüz kimse puan kazanmadı. İlk sen ol!" />;
  }

  const showNoPoints = rows.length > 0 && !hasMeRow && me?.total_points === 0;
  const footer = showNoPoints ? (
    <View style={styles.footer}>
      <EmptyNote text="Henüz puanın yok. Fidan ekle: +20, fotoğrafın onaylanınca: +5." />
    </View>
  ) : undefined;

  return (
    <PageScreen title="Sıralama" contentTop={pageTop.siralama} scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.user_id}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} />}
      />
    </PageScreen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 16 },
  banner: { marginHorizontal: -size.screenPadX, width: 'auto' },
  bannerText: { ...type.banner, color: colors.ink, textAlign: 'center' },
  afterBanner: { height: 20 },
  separator: { height: 10 },
  skeletons: { gap: 10 },
  errorBox: { alignItems: 'flex-start', gap: 8 },
  dots: { ...type.valueBold, color: colors.inkMuted, textAlign: 'center', marginBottom: 6 }, // tasarım: 6 px ortalı üç nokta
  footer: { marginTop: 16 },
});
