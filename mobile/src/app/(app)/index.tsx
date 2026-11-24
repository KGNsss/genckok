import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SvgXml } from 'react-native-svg';
import { useMySaplings } from '@/api/saplings';
import {
  Capsule,
  CircleButton,
  EmptyNote,
  PageScreen,
  PulseBox,
  diacriticRoom,
} from '@/components';
import { toMessage } from '@/lib/errors';
import { useModal } from '@/modal';
import { colors, radius, shadow, space, type } from '@/theme/theme';
import { SVG } from '@/theme/svg';
import FidanDestesi from '@/features/fidan/FidanDestesi';
import { onSaplingAdded } from '@/features/fidan/events';

const CARD_W = 184;
const CARD_H = 276;

export default function FidanlarimScreen() {
  const modal = useModal();
  const { data: saplings, isLoading, isError, error, refetch } = useMySaplings();
  const [focusTreeId, setFocusTreeId] = useState<string | undefined>(undefined);
  const [bannerPressed, setBannerPressed] = useState(false);

  useEffect(() => {
    const unsubscribe = onSaplingAdded((treeId) => {
      setFocusTreeId(treeId);
    });
    return unsubscribe;
  }, []);

  const handleOpenQuote = () => {
    void Haptics.selectionAsync();
    modal.open({ name: 'gunun-sozu' });
  };

  const handleOpenAddSapling = () => {
    void Haptics.selectionAsync();
    modal.open({ name: 'fidan-ekle' });
  };

  return (
    <PageScreen title="Fidanlarım" scroll={false} centerContent>
      <View style={styles.carouselSlot}>
        {isLoading ? (
          <View style={styles.loadingColumn}>
            <PulseBox
              width={CARD_W}
              height={CARD_H}
              radius={radius.cardLg}
            />
            <View style={styles.loadingGap} />
            <PulseBox width={110} height={29} radius={radius.pill} />
          </View>
        ) : isError ? (
          <View style={styles.errorColumn}>
            <EmptyNote text={toMessage(error)} />
            <View style={styles.retryGap} />
            <Capsule
              variant="chip"
              text="Tekrar dene"
              onPress={() => {
                void refetch();
              }}
            />
          </View>
        ) : !saplings || saplings.length === 0 ? (
          <View style={styles.emptyColumn}>
            <CircleButton
              icon="plus"
              size={50}
              onPress={handleOpenAddSapling}
              accessibilityLabel="İlk fidanını ekle"
            />
            <View style={styles.emptyGap} />
            <Capsule
              variant="title"
              text="İlk fidanını ekle"
              onPress={handleOpenAddSapling}
            />
          </View>
        ) : (
          <FidanDestesi saplings={saplings} focusId={focusTreeId} />
        )}
      </View>

      <View style={styles.quoteBannerContainer}>
        <Pressable
          onPress={handleOpenQuote}
          onPressIn={() => setBannerPressed(true)}
          onPressOut={() => setBannerPressed(false)}
          accessibilityLabel="GÜNÜN SÖZÜ"
          style={[
            styles.quoteBannerPressable,
            { transform: [{ scale: bannerPressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={[styles.woodBannerBase, shadow.button]}>
            <SvgXml
              xml={SVG.woodBannerGrain}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              style={StyleSheet.absoluteFill}
            />
            <Text
              numberOfLines={1}
              style={[type.bannerTitle, diacriticRoom, styles.quoteBannerText]}
            >
              GÜNÜN SÖZÜ
            </Text>
          </View>
        </Pressable>
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  carouselSlot: {
    width: '100%',
    height: 385,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGap: {
    height: 10,
  },
  errorColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  retryGap: {
    height: space[4],
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGap: {
    height: 12,
  },
  quoteBannerContainer: {
    position: 'absolute',
    bottom: 24,
    left: -16,
    right: -16,
    height: 56,
    justifyContent: 'center',
  },
  quoteBannerPressable: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
  },
  woodBannerBase: {
    width: '100%',
    height: 44,
    backgroundColor: colors.wood,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.woodGrain,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  quoteBannerText: {
    color: colors.ink,
    zIndex: 1,
  },
});