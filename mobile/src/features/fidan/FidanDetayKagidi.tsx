// SORU: `useUpdateMySapling().mutate(...)` `planted_at` alanını `'YYYY-MM-DD'` mi yoksa `'GG.AA.YYYY'` mi bekliyor? `tarihParse` ile `'YYYY-MM-DD'`'e çevrilip gönderildiği varsayıldı.
// SORU: `LinedPaper` modal içi kaydırmayı kendisi mi sağlar yoksa dış kapsayıcı mı? İçerik taşarsa `ScrollView` içinde gösterildiği varsayıldı.
// SORU: `npx tsc --noEmit` çalıştırıldığında sorumluluğumda olmayan hazır dosyalarda (`giris.tsx`, `kayit.tsx`, `sifre-yenile.tsx`, `LinedPaper.tsx`, `WoodTabBar.tsx`) tip hataları görülüyor; kural gereği bu dosyalara dokunulmadı.
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  Avatar,
  EmptyNote,
  LinedPaper,
  PaperButtonRow,
  PaperInput,
  PaperRow,
  PaperTitleRow,
  PaperValue,
  PillButton,
  PulseBox,
  diacriticRoom,
  useToast,
} from '@/components';
import type { ModalViewProps } from '@/modal';
import { useModal } from '@/modal';
import { useMe } from '@/api/me';
import { useClaimTree, useSapling, useUpdateMySapling } from '@/api/saplings';
import { useUploadPhoto } from '@/api/photos';
import { isCode, toMessage } from '@/lib/errors';
import { avatarUrl, photoUrl, tarih, tarihParse, trUpper } from '@/lib/format';
import { SVG } from '@/theme/svg';
import { alpha, colors, easing, motion, pressed, radius, size, space, type } from '@/theme/theme';

const PAPER_HEIGHT = size.paperH;
const PHOTO_BOX_SIZE = 124;
const PHOTO_ICON_SIZE = size.avatarXs;
const PHOTO_LABEL_GAP = space[1];
const PHOTO_BOX_MARGIN_LEFT = size.paperMarginLeft;
const PHOTO_BOX_MARGIN_RIGHT = space[5];
const PHOTO_BOX_ROW_HEIGHT = 144;
const SKELETON_VALUE_WIDTH = 120;
const SKELETON_VALUE_HEIGHT = 14;
const NICKNAME_MAX_LENGTH = 20;
const SPECIES_MAX_LENGTH = 40;
const DATE_MAX_LENGTH = 10;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const pressEasing = Easing.bezier(...easing.out);

function formatDateInputAutoDot(rawText: string): string {
  const digitsOnly = rawText.replace(/\D/g, '').slice(0, 8);
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  }
  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
}

type SaplingRecord = NonNullable<ReturnType<typeof useSapling>['data']>;

interface FidanDetayIcerikProps {
  sapling: SaplingRecord;
  isAdmin: boolean;
  open: ModalViewProps<'fidan-detay'>['open'];
}

function FidanDetayIcerik({ sapling, isAdmin, open }: FidanDetayIcerikProps) {
  const modal = useModal();
  const toast = useToast();

  const uploadPhotoMutation = useUploadPhoto();
  const updateSaplingMutation = useUpdateMySapling();
  const claimTreeMutation = useClaimTree();

  const initialNickname = sapling.nickname ?? sapling.label ?? '';
  const initialSpecies = sapling.species ?? '';
  const initialPlantedDate = sapling.planted_at ? tarih(sapling.planted_at) : '';

  const [nicknameDraft, setNicknameDraft] = useState(initialNickname);
  const [speciesDraft, setSpeciesDraft] = useState(initialSpecies);
  const [plantedAtDraft, setPlantedAtDraft] = useState(initialPlantedDate);

  const squareScale = useSharedValue(1);
  const squareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: squareScale.value }],
  }));

  const isOwner = Boolean(sapling.is_mine);
  const canClaim = Boolean(sapling.can_claim) && !isOwner;
  const isUploadingPhoto = uploadPhotoMutation.isPending;
  const isSavingSapling = updateSaplingMutation.isPending;
  const isClaimingTree = claimTreeMutation.isPending;

  const resolvedCoverUri = useMemo(() => {
    if (!sapling.cover_path) return null;
    return photoUrl(sapling.cover_path);
  }, [sapling]);

  const resolvedOwnerAvatarUri = useMemo(() => {
    if (!sapling.owner_avatar_path) return null;
    return avatarUrl(sapling.owner_avatar_path);
  }, [sapling]);

  const handleOpenOwnerProfile = useCallback(() => {
    if (!sapling.owner_id) return;
    void Haptics.selectionAsync();
    open({ name: 'kullanici-profili', userId: sapling.owner_id });
  }, [open, sapling]);

  const handlePickAndUploadPhoto = useCallback(async () => {
    if (isUploadingPhoto) return;

    void Haptics.selectionAsync();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Fotoğraf seçmek için galeri izni vermelisin.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const localUri = result.assets[0].uri;

    try {
      const response = await uploadPhotoMutation.mutateAsync({
        localUri,
        treeId: sapling.id,
        setCover: isOwner,
      });

      const awarded = response.points_awarded ?? 0;
      const pointSuffix = awarded > 0 ? ` · +${awarded} puan` : '';

      if (response.status === 'beklemede' || !isAdmin) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.show('Fotoğrafın yönetici onayından sonra görünecek', 'ok');
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (response.is_cover) {
        toast.show(`Kapak fotoğrafı güncellendi${pointSuffix}`, 'ok');
      } else {
        toast.show(`Fotoğraf galeriye eklendi${pointSuffix}`, 'ok');
      }
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(toMessage(err), 'error');
    }
  }, [isAdmin, isOwner, isUploadingPhoto, sapling, toast, uploadPhotoMutation]);

  const handleLongPressCoverPhoto = useCallback(() => {
    if (!sapling.cover_path || isUploadingPhoto) return;
    void Haptics.selectionAsync();
    modal.openFullscreenPhoto(sapling.cover_path);
  }, [isUploadingPhoto, modal, sapling]);

  const handleSaveEdits = useCallback(() => {
    if (!isOwner || isSavingSapling) return;

    const currentNickname = sapling.nickname ?? sapling.label ?? '';
    const currentSpecies = sapling.species ?? '';
    const currentPlantedDateFormatted = sapling.planted_at ? tarih(sapling.planted_at) : '';
    const currentIsoDate = sapling.planted_at ?? null;

    const trimmedNickname = nicknameDraft.trim();
    if (!trimmedNickname) {
      setNicknameDraft(currentNickname);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show('Fidanına bir isim ver.', 'error');
      return;
    }

    const trimmedDate = plantedAtDraft.trim();
    let nextPlantedAt: string | undefined;
    if (trimmedDate.length > 0) {
      const parsedIso = tarihParse(trimmedDate);
      if (!parsedIso) {
        setPlantedAtDraft(currentPlantedDateFormatted);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show('Tarihi GG.AA.YYYY biçiminde yaz.', 'error');
        return;
      }
      nextPlantedAt = parsedIso;
    } else {
      nextPlantedAt = currentIsoDate ?? undefined;
    }

    const trimmedSpecies = speciesDraft.trim();
    const hasNicknameChanged = trimmedNickname !== currentNickname;
    const hasSpeciesChanged = trimmedSpecies !== currentSpecies;
    const hasDateChanged =
      (nextPlantedAt ?? null) !== (currentIsoDate ?? null) ||
      (trimmedDate.length === 0 && currentPlantedDateFormatted.length > 0);

    if (!hasNicknameChanged && !hasSpeciesChanged && !hasDateChanged) {
      return;
    }

    updateSaplingMutation.mutate(
      {
        treeId: sapling.id,
        nickname: trimmedNickname,
        species: trimmedSpecies || undefined,
        planted_at: nextPlantedAt,
      },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.show('Kaydedildi', 'ok');
        },
        onError: (err) => {
          setNicknameDraft(currentNickname);
          setSpeciesDraft(currentSpecies);
          setPlantedAtDraft(currentPlantedDateFormatted);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          toast.show(toMessage(err), 'error');
        },
      },
    );
  }, [
    isOwner,
    isSavingSapling,
    nicknameDraft,
    plantedAtDraft,
    sapling,
    speciesDraft,
    toast,
    updateSaplingMutation,
  ]);

  const handleClaimSapling = useCallback(async () => {
    if (!canClaim || isClaimingTree) return;

    const chosenName = nicknameDraft.trim() || (sapling.nickname ?? sapling.label ?? '').trim();
    if (!chosenName) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show('Fidanına bir isim ver.', 'error');
      return;
    }

    try {
      const result = await claimTreeMutation.mutateAsync({
        treeId: sapling.id,
        nickname: chosenName,
      });
      const awardedPoints = result.points_awarded ?? 0;
      const upperName = trUpper(chosenName);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(`${upperName} artık senin · +${awardedPoints} puan`, 'ok');
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(toMessage(err), 'error');
    }
  }, [canClaim, claimTreeMutation, isClaimingTree, nicknameDraft, sapling, toast]);

  const handlePressInPhoto = useCallback(() => {
    squareScale.modify(() => {
      'worklet';
      return withTiming(pressed.scale, {
        duration: motion.tab,
        easing: pressEasing,
      });
    });
  }, [squareScale]);

  const handlePressOutPhoto = useCallback(() => {
    squareScale.modify(() => {
      'worklet';
      return withTiming(1, {
        duration: motion.tab,
        easing: pressEasing,
      });
    });
  }, [squareScale]);

  const formattedPlantedDate = sapling.planted_at ? tarih(sapling.planted_at) : '-';
  const ownerDisplayText = sapling.owner_name ? sapling.owner_name : 'Sahipsiz';
  const showEditableNickname = isOwner || canClaim;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.photoRowContainer}>
        <AnimatedPressable
          onPress={handlePickAndUploadPhoto}
          onLongPress={handleLongPressCoverPhoto}
          onPressIn={handlePressInPhoto}
          onPressOut={handlePressOutPhoto}
          disabled={isUploadingPhoto}
          style={[
            styles.photoSquare,
            isUploadingPhoto && styles.photoSquareActive,
            squareAnimatedStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Fidan fotoğrafı ekle"
        >
          {resolvedCoverUri ? (
            <Image
              source={{ uri: resolvedCoverUri }}
              contentFit="cover"
              style={styles.photoImage}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <SvgXml xml={SVG.photoIcon} width={PHOTO_ICON_SIZE} height={PHOTO_ICON_SIZE} />
              <Text style={styles.photoPlaceholderText}>Fotoğraf Ekle</Text>
            </View>
          )}

          {isUploadingPhoto && (
            <View style={styles.photoUploadingOverlay}>
              <ActivityIndicator color={colors.forest} />
            </View>
          )}
        </AnimatedPressable>
      </View>

      <PaperRow label="İsim">
        {showEditableNickname ? (
          <PaperInput
            value={nicknameDraft}
            onChangeText={setNicknameDraft}
            onEndEditing={isOwner ? handleSaveEdits : undefined}
            onSubmitEditing={isOwner ? handleSaveEdits : undefined}
            maxLength={NICKNAME_MAX_LENGTH}
            autoCapitalize="characters"
            placeholder={canClaim ? 'Fidanına isim ver' : undefined}
            editable={!isSavingSapling && !isClaimingTree}
            accessibilityLabel="Fidan İsmi"
          />
        ) : (
          <PaperValue text={trUpper(sapling.label)} />
        )}
      </PaperRow>

      <PaperRow label="Sahibi">
        <View style={styles.ownerRowValue}>
          <PaperValue text={ownerDisplayText} />
          {sapling.owner_id ? (
            <Pressable
              onPress={handleOpenOwnerProfile}
              hitSlop={space[2]}
              accessibilityRole="button"
              accessibilityLabel="Fidan Sahibinin Profilini Aç"
            >
              <Avatar path={resolvedOwnerAvatarUri} size="mini" />
            </Pressable>
          ) : null}
        </View>
      </PaperRow>

      <PaperRow label="Türü">
        {isOwner ? (
          <PaperInput
            value={speciesDraft}
            onChangeText={setSpeciesDraft}
            onEndEditing={handleSaveEdits}
            onSubmitEditing={handleSaveEdits}
            maxLength={SPECIES_MAX_LENGTH}
            editable={!isSavingSapling}
            accessibilityLabel="Fidan Türü"
          />
        ) : (
          <PaperValue text={sapling.species ?? '-'} />
        )}
      </PaperRow>

      <PaperRow label="Dikim Tarihi">
        {isOwner ? (
          <PaperInput
            value={plantedAtDraft}
            onChangeText={(text) => setPlantedAtDraft(formatDateInputAutoDot(text))}
            onEndEditing={handleSaveEdits}
            onSubmitEditing={handleSaveEdits}
            keyboardType="number-pad"
            maxLength={DATE_MAX_LENGTH}
            placeholder="GG.AA.YYYY"
            editable={!isSavingSapling}
            accessibilityLabel="Dikim Tarihi"
          />
        ) : (
          <PaperValue text={formattedPlantedDate} />
        )}
      </PaperRow>

      <PaperRow label="Parsel NO">
        <PaperValue text={sapling.parcel_no ?? '-'} />
      </PaperRow>

      <PaperRow label="Sıra NO">
        <PaperValue text={sapling.row_no ?? '-'} />
      </PaperRow>

      {sapling.status === 'kurudu' && (
        <PaperRow label="Durum">
          <Text style={[type.valueBold, styles.deadStatusText, diacriticRoom]}>Kurudu</Text>
        </PaperRow>
      )}

      {canClaim && (
        <PaperButtonRow>
          <PillButton
            label="BU FİDANI BEN DİKTİM"
            size="md"
            loading={isClaimingTree}
            disabled={isClaimingTree}
            onPress={() => {
              void handleClaimSapling();
            }}
          />
        </PaperButtonRow>
      )}
    </ScrollView>
  );
}

export default function FidanDetayKagidi({
  view,
  close,
  open,
}: ModalViewProps<'fidan-detay'>) {
  const { data: me } = useMe();
  const {
    data: sapling,
    isLoading,
    isError,
    error,
    refetch,
  } = useSapling(view.treeId);

  if (isLoading) {
    return (
      <LinedPaper height={PAPER_HEIGHT} mode="modal" onClose={close}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.photoRowContainer}>
            <PulseBox width={PHOTO_BOX_SIZE} height={PHOTO_BOX_SIZE} radius={radius.cardLg} />
          </View>
          <PaperRow label="İsim">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
          <PaperRow label="Sahibi">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
          <PaperRow label="Türü">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
          <PaperRow label="Dikim Tarihi">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
          <PaperRow label="Parsel NO">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
          <PaperRow label="Sıra NO">
            <PulseBox width={SKELETON_VALUE_WIDTH} height={SKELETON_VALUE_HEIGHT} />
          </PaperRow>
        </ScrollView>
      </LinedPaper>
    );
  }

  if (isError || !sapling) {
    if (error && isCode(error, 'GK_TREE_NOT_FOUND')) {
      return (
        <LinedPaper height={PAPER_HEIGHT} mode="modal" onClose={close}>
          <View style={styles.stateCenterContainer}>
            <PaperTitleRow text="FİDAN BULUNAMADI" />
            <PaperButtonRow>
              <PillButton label="KAPAT" size="md" onPress={close} />
            </PaperButtonRow>
          </View>
        </LinedPaper>
      );
    }

    return (
      <LinedPaper height={PAPER_HEIGHT} mode="modal" onClose={close}>
        <View style={styles.stateCenterContainer}>
          <PaperTitleRow text="BİR SORUN OLDU" />
          <EmptyNote text={toMessage(error)} />
          <PaperButtonRow>
            <PillButton
              label="TEKRAR DENE"
              size="md"
              onPress={() => {
                void refetch();
              }}
            />
          </PaperButtonRow>
        </View>
      </LinedPaper>
    );
  }

  const isAdmin = me?.role === 'admin';

  return (
    <LinedPaper height={PAPER_HEIGHT} mode="modal" onClose={close}>
      <FidanDetayIcerik key={sapling.id} sapling={sapling} isAdmin={isAdmin} open={open} />
    </LinedPaper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space[4],
  },
  photoRowContainer: {
    height: PHOTO_BOX_ROW_HEIGHT,
    marginLeft: PHOTO_BOX_MARGIN_LEFT,
    marginRight: PHOTO_BOX_MARGIN_RIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSquare: {
    width: PHOTO_BOX_SIZE,
    height: PHOTO_BOX_SIZE,
    borderRadius: radius.cardLg,
    backgroundColor: alpha.forest15,
    borderWidth: 1,
    borderColor: alpha.forest45,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSquareActive: {
    backgroundColor: alpha.forest25,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: PHOTO_LABEL_GAP,
  },
  photoPlaceholderText: {
    ...type.tiny,
    color: colors.inkSoft,
  },
  photoUploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha.forest25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerRowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  deadStatusText: {
    color: colors.danger,
  },
  stateCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: space[2],
  },
});