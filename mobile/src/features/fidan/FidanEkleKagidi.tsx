import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SvgXml } from 'react-native-svg';
import { useAddMySapling } from '@/api/saplings';
import { useUploadPhoto } from '@/api/photos';
import { useMe } from '@/api/me';
import {
  PaperButtonRow,
  PaperInput,
  PaperRow,
  PaperTitleRow,
  PillButton,
  useToast,
} from '@/components';
import { toMessage } from '@/lib/errors';
import { tarihParse, trUpper } from '@/lib/format';
import type { ModalViewProps } from '@/modal';
import { alpha, colors, pressed, radius, space, type } from '@/theme/theme';
import { SVG } from '@/theme/svg';
import { emitSaplingAdded } from './events';

function formatDateInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '').slice(0, 8);
  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  }
  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
}

function isAfterToday(isoDate: string): boolean {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return false;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(year, month - 1, day).getTime();
  return targetStart > todayStart;
}

export default function FidanEkleKagidi({ close }: ModalViewProps<'fidan-ekle'>) {
  const toast = useToast();
  const { data: me } = useMe();
  const addSaplingMutation = useAddMySapling();
  const uploadPhotoMutation = useUploadPhoto();

  const [nickname, setNickname] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [plantedDateText, setPlantedDateText] = useState('');
  const [species, setSpecies] = useState('');
  const [parcelNo, setParcelNo] = useState('');
  const [rowNo, setRowNo] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    if (submitting) return;
    setErrorText(null);
    void Haptics.selectionAsync();

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show('Galeri izni gerekli', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    if (submitting) return;
    void Haptics.selectionAsync();
    setPhotoUri(null);
  };

  const handleDateChange = (text: string) => {
    setPlantedDateText(formatDateInput(text));
    if (errorText) setErrorText(null);
  };

  const validateForm = (): {
    ok: boolean;
    parsedPlantedAt?: string;
  } => {
    const trimmedName = nickname.trim();
    const trimmedParcel = parcelNo.trim();
    const trimmedRow = rowNo.trim();
    const trimmedDate = plantedDateText.trim();

    if (!trimmedName) {
      setErrorText('Fidanına bir isim ver.');
      return { ok: false };
    }

    if (!trimmedParcel || !trimmedRow) {
      setErrorText('Parsel ve sıra numarasını yaz.');
      return { ok: false };
    }

    let parsedPlantedAt: string | undefined;
    if (trimmedDate.length > 0) {
      const parsed = tarihParse(trimmedDate);
      if (!parsed) {
        setErrorText('Tarihi GG.AA.YYYY biçiminde yaz.');
        return { ok: false };
      }
      if (isAfterToday(parsed)) {
        setErrorText('Dikim tarihi bugünden sonra olamaz.');
        return { ok: false };
      }
      parsedPlantedAt = parsed;
    }

    setErrorText(null);
    return { ok: true, parsedPlantedAt };
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const validation = validateForm();
    if (!validation.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    try {
      const trimmedName = nickname.trim();
      const trimmedSpecies = species.trim();
      const trimmedParcel = parcelNo.trim();
      const trimmedRow = rowNo.trim();

      const res = await addSaplingMutation.mutateAsync({
        nickname: trimmedName,
        parcel_no: trimmedParcel,
        row_no: trimmedRow,
        species: trimmedSpecies || undefined,
        planted_at: validation.parsedPlantedAt,
      });

      let photoUploadFailed = false;
      let photoPendingReview = false;

      if (photoUri) {
        try {
          const photoRes = await uploadPhotoMutation.mutateAsync({
            localUri: photoUri,
            treeId: res.tree_id,
            setCover: true,
          });
          photoPendingReview =
            photoRes.status === 'beklemede' && me?.role !== 'admin';
        } catch {
          photoUploadFailed = true;
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const upperLabel = trUpper(trimmedName);
      const baseMsg = res.created
        ? `${upperLabel} ormana eklendi · +${res.points_awarded} puan`
        : `${upperLabel} artık senin · +${res.points_awarded} puan`;

      if (photoUploadFailed) {
        toast.show('Fidan eklendi ama fotoğraf yüklenemedi', 'error');
      } else if (photoPendingReview) {
        toast.show(
          `${baseMsg} Fotoğrafın yönetici onayından sonra görünecek.`,
          'ok'
        );
      } else {
        toast.show(baseMsg, 'ok');
      }

      emitSaplingAdded(res.tree_id);
      close();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorText(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <PaperTitleRow text="FİDAN EKLE" />

      <PaperRow label="İsim">
        <PaperInput
          value={nickname}
          onChangeText={(val) => {
            setNickname(val);
            if (errorText) setErrorText(null);
          }}
          placeholder="GROOT"
          maxLength={20}
          autoCapitalize="characters"
          editable={!submitting}
          accessibilityLabel="Fidan İsmi"
        />
      </PaperRow>

      <PaperRow label="Fotoğraf">
        <Pressable
          onPress={handlePickPhoto}
          disabled={submitting}
          accessibilityLabel="Fotoğraf Ekle"
          style={({ pressed: isPressed }) => [
            styles.photoButton,
            {
              backgroundColor: isPressed ? alpha.forest25 : alpha.forest15,
              transform: [{ scale: isPressed ? pressed.scale : 1 }],
            },
          ]}
        >
          <SvgXml xml={SVG.photoIcon} width={16} height={16} color={colors.forest} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[type.buttonSmall, styles.photoButtonLabel]}
          >
            {photoUri ? 'Fotoğraf seçildi' : 'Fotoğraf Seç'}
          </Text>
        </Pressable>
      </PaperRow>

      {photoUri ? (
        <View style={styles.previewOuter}>
          <Pressable
            onPress={handleRemovePhoto}
            disabled={submitting}
            accessibilityLabel="Seçilen Fotoğrafı Kaldır"
            style={({ pressed: isPressed }) => [
              styles.previewBox,
              { transform: [{ scale: isPressed ? pressed.scale : 1 }] },
            ]}
          >
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </Pressable>
        </View>
      ) : null}

      <PaperRow label="Dikim Tarihi">
        <PaperInput
          value={plantedDateText}
          onChangeText={handleDateChange}
          placeholder="GG.AA.YYYY"
          keyboardType="number-pad"
          maxLength={10}
          editable={!submitting}
          accessibilityLabel="Dikim Tarihi"
        />
      </PaperRow>

      <PaperRow label="Fidan Türü">
        <PaperInput
          value={species}
          onChangeText={(val) => {
            setSpecies(val);
            if (errorText) setErrorText(null);
          }}
          placeholder="Çınar"
          maxLength={40}
          editable={!submitting}
          accessibilityLabel="Fidan Türü"
        />
      </PaperRow>

      <PaperRow label="Bulunduğu Parsel">
        <PaperInput
          value={parcelNo}
          onChangeText={(val) => {
            setParcelNo(val);
            if (errorText) setErrorText(null);
          }}
          placeholder="A"
          maxLength={10}
          autoCapitalize="characters"
          editable={!submitting}
          accessibilityLabel="Bulunduğu Parsel"
        />
      </PaperRow>

      <PaperRow label="Sıra NO">
        <PaperInput
          value={rowNo}
          onChangeText={(val) => {
            setRowNo(val);
            if (errorText) setErrorText(null);
          }}
          placeholder="12"
          maxLength={10}
          autoCapitalize="characters"
          editable={!submitting}
          accessibilityLabel="Sıra NO"
        />
      </PaperRow>

      {errorText ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      <PaperButtonRow>
        <PillButton
          label="EKLE"
          size="md"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        />
      </PaperButtonRow>
    </View>
  );
}

const styles = StyleSheet.create({
  photoButton: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: alpha.forest45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonLabel: {
    marginLeft: 6,
    maxWidth: 115,
  },
  previewOuter: {
    paddingLeft: 48,
    paddingRight: 20,
    paddingTop: space[3],
    alignItems: 'center',
  },
  previewBox: {
    width: 184,
    height: 168,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: alpha.forest45,
    backgroundColor: alpha.forest15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  errorRow: {
    paddingLeft: 48,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});