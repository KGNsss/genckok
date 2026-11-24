// Galeri - Fotoğraf Detay Kağıdı
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { useDeletePhoto, usePhoto, useReviewPhoto, useToggleFavorite } from '@/api/photos';
import { useMe } from '@/api/me';
import { Avatar, PaperButtonRow, PaperInput, PaperRow, PaperTitleRow, PaperValue, PillButton, PulseBox, useToast } from '@/components';
import { isCode, toMessage } from '@/lib/errors';
import { photoUrl, tarih } from '@/lib/format';
import { useModal, type ModalViewProps } from '@/modal';
import { SVG } from '@/theme/svg';
import { alpha, colors, fonts, radius, shadow } from '@/theme/theme';

export default function FotoDetayKagidi({ view, close, open }: ModalViewProps<'foto-detay'>) {
  const { data: photo, isLoading, error } = usePhoto(view.photoId);
  const { data: me } = useMe();
  const modal = useModal();
  const toast = useToast();

  const toggleFavorite = useToggleFavorite();
  const reviewPhoto = useReviewPhoto();
  const deletePhoto = useDeletePhoto();

  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const heartPop = useSharedValue(1);
  const heartPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartPop.value }],
  }));

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <PaperTitleRow text="FOTOĞRAF BULUNAMADI" />
        <View style={styles.closeBtnWrap}>
          <PillButton size="md" label="KAPAT" onPress={close} />
        </View>
      </View>
    );
  }

  if (isLoading || !photo) {
    return (
      <View style={styles.loadingContainer}>
        <PulseBox width={248} height={248} radius={radius.cardLg} />
        <View style={styles.loadingRows}>
          <PaperRow label="Çeken Kullanıcı">
            <PulseBox width={100} height={14} radius={radius.pill} />
          </PaperRow>
          <PaperRow label="Tarih">
            <PulseBox width={100} height={14} radius={radius.pill} />
          </PaperRow>
        </View>
      </View>
    );
  }

  const isAdmin = me?.role === 'admin';
  const isMine = photo.is_mine ?? photo.user_id === me?.id;
  const canDelete = isMine || isAdmin;
  const isApproved = photo.status === 'onaylandi';

  const onToggleFavorite = () => {
    const nextFav = !photo.is_favorite;
    toggleFavorite.mutate(photo.id);
    Haptics.selectionAsync();
    if (nextFav) {
      heartPop.set(
        withSequence(
          withTiming(1.1, { duration: 80 }),
          withTiming(1, { duration: 80 }),
        ),
      );
    }
  };

  const handleApprove = async () => {
    if (actionLoading) return;
    setActionLoading('approve');
    try {
      const res = await reviewPhoto.mutateAsync({ photoId: photo.id, approve: true });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const pointsText = res.points_awarded > 0 ? ' · +5 puan yükleyene' : '';
      toast.show(`Onaylandı${pointsText}`);
      close();
    } catch (err) {
      toast.show(toMessage(err), 'error');
      if (isCode(err, 'GK_PHOTO_NOT_PENDING')) {
        close();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (actionLoading) return;
    setActionLoading('reject');
    try {
      await reviewPhoto.mutateAsync({
        photoId: photo.id,
        approve: false,
        note: rejectNote.trim() || null,
      });
      toast.show('Reddedildi');
      close();
    } catch (err) {
      toast.show(toMessage(err), 'error');
      if (isCode(err, 'GK_PHOTO_NOT_PENDING')) {
        close();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    Alert.alert('Fotoğrafı sil', 'Bu fotoğraf kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto.mutateAsync({ id: photo.id, storage_path: photo.storage_path });
            toast.show('Fotoğraf silindi');
            close();
          } catch (e) {
            toast.show(toMessage(e), 'error');
          }
        },
      },
    ]);
  };

  const photoUri = photoUrl(photo.storage_path) ?? photo.storage_path;
  const heartXml = photo.is_favorite
    ? SVG.heart.replace('fill="none"', `fill="${colors.heart}"`).replace('currentColor', colors.heart)
    : SVG.heart.replace('currentColor', colors.forest);

  return (
    <View style={styles.container}>
      {/* 1. Fotoğraf Alanı */}
      <View style={styles.photoContainer}>
        <View style={styles.photoBox}>
          {photoUri ? (
            <Image source={photoUri} contentFit="cover" style={StyleSheet.absoluteFill} />
          ) : null}

          {/* Kalp Butonu (Sadece onaylı fotoğraflar) */}
          {isApproved ? (
            <Pressable
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel="Favorilere Ekle/Çıkar"
              style={({ pressed }) => [
                styles.glassBtn,
                styles.heartPos,
                {
                  backgroundColor: pressed ? alpha.forest30 : alpha.forest20,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                },
              ]}
            >
              <Animated.View style={[styles.glassBtnInner, heartPopStyle]}>
                <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                <SvgXml xml={heartXml} width={20} height={20} />
              </Animated.View>
            </Pressable>
          ) : null}

          {/* Büyüt Butonu */}
          <Pressable
            onPress={() => modal.openFullscreenPhoto(photo.storage_path)}
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı Büyüt"
            style={({ pressed }) => [
              styles.glassBtn,
              styles.expandPos,
              {
                backgroundColor: pressed ? alpha.forest30 : alpha.forest20,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <View style={styles.glassBtnInner}>
              <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
              <SvgXml xml={SVG.expand} width={20} height={20} color={colors.forest} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* 2. Satırlar */}
      <PaperRow label="Çeken Kullanıcı">
        <PaperValue text={isMine ? 'Ben' : photo.uploader_name} />
        <View style={styles.avatarSpacer} />
        <Avatar
          size="mini"
          path={photo.uploader_avatar_path}
          onPress={() => open({ name: 'kullanici-profili', userId: photo.user_id })}
          accessibilityLabel="Kullanıcı Profilini Aç"
        />
      </PaperRow>

      <PaperRow label="Tarih">
        <PaperValue text={tarih(photo.taken_at)} />
      </PaperRow>

      {/* 3. Onay Durumu */}
      {!isApproved ? (
        <>
          <PaperRow label="Durum">
            <PaperValue
              text={photo.status === 'beklemede' ? 'Onay bekliyor' : 'Reddedildi'}
              style={{ color: photo.status === 'beklemede' ? colors.inkMuted : colors.danger }}
            />
          </PaperRow>
          {photo.status === 'reddedildi' && photo.review_note ? (
            <PaperRow label="Neden">
              <PaperValue text={photo.review_note} />
            </PaperRow>
          ) : null}
        </>
      ) : null}

      {/* 4. Yönetici Kontrolleri */}
      {isAdmin && photo.status === 'beklemede' ? (
        <>
          <PaperRow label="Neden">
            <PaperInput
              placeholder="Reddedersen yaz (isteğe bağlı)"
              maxLength={200}
              value={rejectNote}
              onChangeText={setRejectNote}
            />
          </PaperRow>
          <PaperButtonRow>
            <PillButton
              size="md"
              label="ONAYLA"
              loading={actionLoading === 'approve'}
              disabled={actionLoading !== null}
              onPress={handleApprove}
            />
            <PillButton
              size="md"
              label="REDDET"
              loading={actionLoading === 'reject'}
              disabled={actionLoading !== null}
              onPress={handleReject}
            />
          </PaperButtonRow>
        </>
      ) : null}

      {/* 5. Silme */}
      {canDelete ? (
        <View style={styles.deleteWrap}>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı sil"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.deleteText}>Fotoğrafı sil</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  photoContainer: {
    height: 288,
    paddingLeft: 48,
    paddingRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBox: {
    width: 248,
    height: 248,
    borderRadius: radius.cardLg,
    backgroundColor: colors.cardBlue,
    borderWidth: 2,
    borderColor: alpha.forest45,
    ...shadow.avatar,
    overflow: 'hidden',
    position: 'relative',
  },
  glassBtn: {
    position: 'absolute',
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha.forest40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartPos: {
    top: 12,
    left: 12,
  },
  expandPos: {
    top: 12,
    right: 12,
  },
  glassBtnInner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSpacer: {
    width: 8,
  },
  deleteWrap: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingRows: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  closeBtnWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
});
