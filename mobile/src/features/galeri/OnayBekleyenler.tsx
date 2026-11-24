// Galeri - Onay Bekleyenler Bölümü (Sadece Admin)
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { flatPages, useGallery } from '@/api/photos';
import { qk } from '@/api/keys';
import type { GalleryPhoto } from '@/api/types';
import { Capsule, EmptyNote, PhotoTile, PulseBox } from '@/components';
import { toMessage } from '@/lib/errors';
import { useModal } from '@/modal';
import { radius } from '@/theme/theme';

type OnayBekleyenlerProps = {
  onSelectPhoto?: (photo: GalleryPhoto) => void;
};

export default function OnayBekleyenler({ onSelectPhoto }: OnayBekleyenlerProps) {
  const qc = useQueryClient();
  const modal = useModal();
  const { data, isPending, isError, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGallery('pending');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const photos = flatPages(data);

  const handleSelect = (photo: GalleryPhoto) => {
    qc.setQueryData(qk.photo(photo.id), photo);
    modal.open({ name: 'foto-detay', photoId: photo.id });
    onSelectPhoto?.(photo);
  };

  const countText = photos.length >= 40 ? '40+' : `${photos.length}`;

  return (
    <View style={styles.section}>
      <Capsule variant="title" text={`Onay Bekleyenler · ${countText}`} />

      <View style={styles.contentWrap}>
        {isPending && !data ? (
          <View style={styles.skeletonRow}>
            {[0, 1, 2, 3].map((key) => (
              <PulseBox key={key} width={78} height={78} radius={radius.card} />
            ))}
          </View>
        ) : isError ? (
          <View style={styles.errorRow}>
            <EmptyNote text={toMessage(error)} />
            <Capsule variant="chip" text="Tekrar dene" onPress={() => refetch()} />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyRow}>
            <EmptyNote text="Onay bekleyen fotoğraf yok." />
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={photos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.6}
            renderItem={({ item }) => (
              <PhotoTile
                path={item.storage_path}
                size={78}
                status={item.status}
                onPress={() => handleSelect(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  contentWrap: {
    marginTop: 2,
  },
  listContent: {
    gap: 10,
    paddingRight: 16,
    paddingBottom: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  emptyRow: {
    height: 78,
    justifyContent: 'center',
  },
  errorRow: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
