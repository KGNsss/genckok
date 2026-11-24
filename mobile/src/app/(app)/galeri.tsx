// Sayfa 6 - Galeri Ekranı
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '@/api/me';
import { flatPages, useGallery } from '@/api/photos';
import { qk } from '@/api/keys';
import type { GalleryPhoto } from '@/api/types';
import { Capsule, EmptyNote, PageScreen, PhotoTile, PulseBox } from '@/components';
import OnayBekleyenler from '@/features/galeri/OnayBekleyenler';
import { toMessage } from '@/lib/errors';
import { useModal } from '@/modal';
import { colors, radius, size } from '@/theme/theme';

export default function GaleriScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const qc = useQueryClient();
  const modal = useModal();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin';

  const [showAllMine, setShowAllMine] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Veri sorguları
  const favoritesQuery = useGallery('favorites');
  const mineQuery = useGallery('mine');
  const othersQuery = useGallery('others');

  const favorites = flatPages(favoritesQuery.data);
  const minePhotos = flatPages(mineQuery.data);
  const othersPhotos = flatPages(othersQuery.data);

  // Sekmeye her gelişte 'mine' sessizce yenilenir
  useFocusEffect(
    useCallback(() => {
      mineQuery.refetch();
    }, [mineQuery]),
  );

  // Aşağı çekip yenileme
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const promises: Promise<unknown>[] = [
        favoritesQuery.refetch(),
        mineQuery.refetch(),
        othersQuery.refetch(),
      ];
      if (isAdmin) {
        promises.push(qc.refetchQueries({ queryKey: qk.gallery('pending') }));
      }
      await Promise.all(promises);
    } finally {
      setRefreshing(false);
    }
  }, [favoritesQuery, mineQuery, othersQuery, isAdmin, qc]);

  // Hücreye dokununca önbelleğe koyup kağıdı aç
  const handleSelectPhoto = (item: GalleryPhoto) => {
    qc.setQueryData(qk.photo(item.id), item);
    modal.open({ name: 'foto-detay', photoId: item.id });
  };

  // 4 sütunlu ızgara için hücre genişliği hesabı
  const screenPad = size.screenPadX * 2;
  const colGaps = 8 * 3;
  const cellWidth = Math.floor((windowWidth - screenPad - colGaps) / 4);

  const displayedMine = showAllMine ? minePhotos : minePhotos.slice(0, 8);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Onay Bekleyenler (Sadece Admin) */}
      {isAdmin ? (
        <View style={styles.adminSection}>
          <OnayBekleyenler onSelectPhoto={handleSelectPhoto} />
        </View>
      ) : null}

      {/* 2. Favoriler Bölümü */}
      <View style={[styles.section, isAdmin && styles.sectionMarginTop]}>
        <Capsule variant="title" text="Favoriler" />

        <View style={styles.subContentWrap}>
          {favoritesQuery.isPending && !favoritesQuery.data ? (
            <View style={styles.horizontalSkeleton}>
              {[0, 1, 2, 3].map((k) => (
                <PulseBox key={k} width={78} height={78} radius={radius.card} />
              ))}
            </View>
          ) : favoritesQuery.isError ? (
            <View style={styles.errorRow}>
              <EmptyNote text={toMessage(favoritesQuery.error)} />
              <Capsule variant="chip" text="Tekrar dene" onPress={() => favoritesQuery.refetch()} />
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.favEmptyRow}>
              <EmptyNote text="Kalbe dokunduğun fotoğraflar burada durur." />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={favorites}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              onEndReached={() => {
                if (favoritesQuery.hasNextPage && !favoritesQuery.isFetchingNextPage) {
                  favoritesQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.6}
              renderItem={({ item }) => (
                <PhotoTile
                  path={item.storage_path}
                  size={78}
                  status={item.status}
                  onPress={() => handleSelectPhoto(item)}
                />
              )}
            />
          )}
        </View>
      </View>

      {/* 3. Benim Fotoğraflarım Bölümü */}
      <View style={[styles.section, styles.sectionMarginTop]}>
        <Capsule variant="title" text="Benim Fotoğraflarım" />

        <View style={styles.gridContentWrap}>
          {mineQuery.isPending && !mineQuery.data ? (
            <View style={styles.gridSkeletonRow}>
              {[0, 1, 2, 3].map((k) => (
                <PulseBox key={k} width={cellWidth} height={cellWidth} radius={radius.card} />
              ))}
            </View>
          ) : mineQuery.isError ? (
            <View style={styles.errorRow}>
              <EmptyNote text={toMessage(mineQuery.error)} />
              <Capsule variant="chip" text="Tekrar dene" onPress={() => mineQuery.refetch()} />
            </View>
          ) : minePhotos.length === 0 ? (
            <EmptyNote text="Kamera sekmesinden ilk fotoğrafını çek." />
          ) : (
            <>
              <View style={styles.myPhotosGrid}>
                {displayedMine.map((item) => (
                  <View key={item.id} style={{ width: cellWidth, height: cellWidth }}>
                    <PhotoTile
                      path={item.storage_path}
                      status={item.status}
                      onPress={() => handleSelectPhoto(item)}
                    />
                  </View>
                ))}
              </View>

              {minePhotos.length > 8 ? (
                <View style={styles.toggleRow}>
                  {!showAllMine ? (
                    <Capsule
                      variant="chip"
                      text="Tümünü göster"
                      onPress={() => setShowAllMine(true)}
                    />
                  ) : (
                    <View style={styles.chipActions}>
                      <Capsule
                        variant="chip"
                        text="Daha az göster"
                        onPress={() => setShowAllMine(false)}
                      />
                      {mineQuery.hasNextPage ? (
                        <Capsule
                          variant="chip"
                          text="Daha fazla"
                          onPress={() => mineQuery.fetchNextPage()}
                        />
                      ) : null}
                    </View>
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>

      {/* 4. Diğer Kullanıcılardan Fotoğraflar Başlığı */}
      <View style={[styles.section, styles.sectionMarginTop, styles.othersTitleSpacing]}>
        <Capsule variant="title" text="Diğer Kullanıcılardan Fotoğraflar" />
      </View>
    </View>
  );

  return (
    <PageScreen title="Galeri" scroll={false}>
      <FlatList
        data={othersPhotos}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.forest}
            colors={[colors.forest]}
          />
        }
        onEndReached={() => {
          if (othersQuery.hasNextPage && !othersQuery.isFetchingNextPage) {
            othersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <View style={{ width: cellWidth, height: cellWidth }}>
            <PhotoTile
              path={item.storage_path}
              status={item.status}
              onPress={() => handleSelectPhoto(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          othersQuery.isPending && !othersQuery.data ? (
            <View style={styles.gridSkeletonRow}>
              {[0, 1, 2, 3].map((k) => (
                <PulseBox key={k} width={cellWidth} height={cellWidth} radius={radius.card} />
              ))}
            </View>
          ) : othersQuery.isError ? (
            <View style={styles.errorRow}>
              <EmptyNote text={toMessage(othersQuery.error)} />
              <Capsule variant="chip" text="Tekrar dene" onPress={() => othersQuery.refetch()} />
            </View>
          ) : (
            <EmptyNote text="Henüz başka kimse fotoğraf paylaşmadı." />
          )
        }
        ListFooterComponent={
          othersQuery.isFetchingNextPage ? (
            <View style={styles.footerSkeleton}>
              {[0, 1, 2, 3].map((k) => (
                <PulseBox key={k} width={cellWidth} height={cellWidth} radius={radius.card} />
              ))}
            </View>
          ) : undefined
        }
      />
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 78,
    paddingBottom: 16,
  },
  columnWrapper: {
    gap: 8,
  },
  itemSeparator: {
    height: 8,
  },
  headerContainer: {
    width: '100%',
  },
  adminSection: {
    width: '100%',
  },
  section: {
    width: '100%',
  },
  sectionMarginTop: {
    marginTop: 24,
  },
  othersTitleSpacing: {
    marginBottom: 14,
  },
  subContentWrap: {
    marginTop: 2,
  },
  gridContentWrap: {
    marginTop: 14,
  },
  horizontalList: {
    gap: 10,
    paddingRight: 16,
    paddingBottom: 4,
  },
  horizontalSkeleton: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  favEmptyRow: {
    height: 78,
    justifyContent: 'center',
  },
  myPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridSkeletonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleRow: {
    marginTop: 8,
  },
  chipActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  errorRow: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerSkeleton: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
