// SORU: Düzenleme modundaki tik butonu için tasarımda rgba(37,195,0,0.30) verilmiş; theme.ts'te alpha.vine30 yoksa en yakın değer olan alpha.vine35 kullanıldı.
// SORU: Düzenleme input zemini için tasarımda rgba(224,255,217,0.80) verilmiş; sabit renk yazmama kuralı gereği colors.bg kullanıldı. theme.ts'te şeffaf bg token'ı varsa ona geçilebilir.
// SORU: api/me.ts içindeki useUpdateMe mutation'ı boş bırakılan department ve school alanları için string mi yoksa null mu bekliyor? Görev dokümanındaki çağrıya uygun olarak string (class_year için number | null) gönderildi.

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";

import { signOut } from "@/api/auth";
import { useMe, useUpdateMe, useUploadAvatar } from "@/api/me";
import { useMySaplings } from "@/api/saplings";
import {
    Avatar,
    Capsule,
    CapsuleLabel,
    EmptyNote,
    Icon,
    PageScreen,
    PulseBox,
    RoleChip,
    useToast,
} from "@/components";
import { toMessage } from "@/lib/errors";
import { trUpper } from "@/lib/format";
import { useModal } from "@/modal";
import {
    alpha,
    colors,
    pageTop,
    pressed,
    radius,
    shadow,
    type,
} from "@/theme/theme";

type UpdateMePayload = Parameters<
  ReturnType<typeof useUpdateMe>["mutateAsync"]
>[0];

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const;

export default function ProfilimScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const maxRowWidth = screenWidth - 32; // tasarım ekran genişliği - 32

  const modal = useModal();
  const toast = useToast();

  const meQuery = useMe();
  const saplingsQuery = useMySaplings();
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();

  const me = meQuery.data;
  const isVolunteer = me?.role === "gonullu";

  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftYear, setDraftYear] = useState("");
  const [draftDepartment, setDraftDepartment] = useState("");
  const [draftSchool, setDraftSchool] = useState("");

  // Düzenleme modundayken sayfadan çıkılırsa değişiklikler atılır
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsEditing(false);
      };
    }, []),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([meQuery.refetch(), saplingsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [meQuery, saplingsQuery]);

  const startEditing = useCallback(() => {
    if (!me) return;
    void Haptics.selectionAsync();
    setDraftName(me.full_name ?? "");
    setDraftYear(me.class_year != null ? String(me.class_year) : "");
    setDraftDepartment(me.department ?? "");
    setDraftSchool(me.school ?? "");
    setIsEditing(true);
  }, [me]);

  const handleSave = useCallback(async () => {
    if (!me || updateMe.isPending) return;

    const trimmedName = draftName.trim();
    if (!trimmedName) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show("İsim Soyisim boş olamaz.", "error");
      return;
    }

    const trimmedYear = draftYear.trim();
    const maxAllowedYear = new Date().getFullYear() + 1;

    if (!isVolunteer && trimmedYear.length > 0) {
      const numericYear = Number(trimmedYear);
      if (
        !/^\d{4}$/.test(trimmedYear) ||
        numericYear < 1990 ||
        numericYear > maxAllowedYear
      ) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show("Giriş yılını kontrol et.", "error");
        return;
      }
    }

    const payload: UpdateMePayload = {};

    if (trimmedName !== (me.full_name ?? "")) {
      payload.full_name = trimmedName;
    }

    if (!isVolunteer) {
      const nextYear = trimmedYear.length > 0 ? Number(trimmedYear) : null;
      const currentYear = me.class_year ?? null;
      if (nextYear !== currentYear) {
        payload.class_year = nextYear;
      }

      const trimmedDepartment = draftDepartment.trim();
      if (trimmedDepartment !== (me.department ?? "")) {
        payload.department = trimmedDepartment;
      }

      const trimmedSchool = draftSchool.trim();
      if (trimmedSchool !== (me.school ?? "")) {
        payload.school = trimmedSchool;
      }
    }

    if (Object.keys(payload).length === 0) {
      void Haptics.selectionAsync();
      setIsEditing(false);
      return;
    }

    try {
      await updateMe.mutateAsync(payload);
      setIsEditing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Kaydedildi", "ok");
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(toMessage(err), "error");
    }
  }, [
    draftDepartment,
    draftName,
    draftSchool,
    draftYear,
    isVolunteer,
    me,
    toast,
    updateMe,
  ]);

  const handleToggleEdit = useCallback(() => {
    if (updateMe.isPending) return;
    if (isEditing) {
      void handleSave();
    } else {
      startEditing();
    }
  }, [handleSave, isEditing, startEditing, updateMe.isPending]);

  const handlePickAvatar = useCallback(async () => {
    if (uploadAvatar.isPending) return;

    void Haptics.selectionAsync();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show("Galeri izni gerekli", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    try {
      await uploadAvatar.mutateAsync(result.assets[0].uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Profil fotoğrafın güncellendi", "ok");
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(toMessage(err), "error");
    }
  }, [toast, uploadAvatar]);

  const handleOpenLeaderboard = useCallback(() => {
    void Haptics.selectionAsync();
    router.navigate("/(app)/siralama");
  }, []);

  const confirmSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(toMessage(err), "error");
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, toast]);

  const handleSignOutPress = useCallback(() => {
    if (isSigningOut) return;
    void Haptics.selectionAsync();
    Alert.alert("Çıkış yap", "Hesabından çıkmak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış yap",
        style: "destructive",
        onPress: () => {
          void confirmSignOut();
        },
      },
    ]);
  }, [confirmSignOut, isSigningOut]);

  const renderSaplingsContent = () => {
    if (saplingsQuery.isPending) {
      return <PulseBox width={80} height={24} radius={radius.pill} />;
    }

    if (saplingsQuery.isError) {
      return (
        <View style={styles.inlineErrorWrap}>
          <EmptyNote text={toMessage(saplingsQuery.error)} />
          <Capsule
            variant="chip"
            text="Tekrar dene"
            onPress={() => {
              void Haptics.selectionAsync();
              void saplingsQuery.refetch();
            }}
          />
        </View>
      );
    }

    const saplings = saplingsQuery.data ?? [];
    if (saplings.length === 0) {
      return (
        <Capsule
          variant="chip"
          text="Fidan ekle"
          onPress={() => {
            void Haptics.selectionAsync();
            modal.open({ name: "fidan-ekle" });
          }}
        />
      );
    }

    return saplings.map((sapling) => (
      <Capsule
        key={sapling.id}
        variant="chip"
        text={trUpper(sapling.label)}
        onPress={() => {
          void Haptics.selectionAsync();
          modal.open({ name: "fidan-detay", treeId: sapling.id });
        }}
      />
    ));
  };

  return (
    <PageScreen
      title="Profilim"
      contentTop={pageTop.profilim}
      refreshing={refreshing}
      onRefresh={() => {
        void handleRefresh();
      }}
    >
      {me ? (
        <Pressable
          onPress={handleToggleEdit}
          disabled={updateMe.isPending}
          accessibilityRole="button"
          accessibilityLabel="İsmi Düzenle"
          style={({ pressed: isPressed }) => [
            styles.editButton,
            isEditing && styles.editButtonActive,
            isPressed && styles.editButtonPressed,
          ]}
        >
          {updateMe.isPending ? (
            <ActivityIndicator size="small" color={colors.forest} />
          ) : (
            <Icon
              name={isEditing ? "check" : "pencil"}
              size={20}
              color={colors.forest}
            />
          )}
        </Pressable>
      ) : null}

      <View style={styles.content}>
        {meQuery.isPending ? (
          <>
            <View style={styles.avatarContainer}>
              <PulseBox width={144} height={144} radius={radius.pill} />
            </View>
            <View style={styles.rowsContainer}>
              {SKELETON_ROWS.map((item) => (
                <PulseBox
                  key={item}
                  width={220}
                  height={34}
                  radius={radius.pill}
                />
              ))}
            </View>
          </>
        ) : meQuery.isError || !me ? (
          <View style={styles.errorState}>
            <EmptyNote text={toMessage(meQuery.error)} />
            <Capsule
              variant="chip"
              text="Tekrar dene"
              onPress={() => {
                void Haptics.selectionAsync();
                void meQuery.refetch();
              }}
            />
          </View>
        ) : (
          <>
            {/* Profil Fotoğrafı */}
            <View style={styles.avatarContainer}>
              <Pressable
                onPress={() => {
                  void handlePickAvatar();
                }}
                disabled={uploadAvatar.isPending}
                accessibilityRole="button"
                accessibilityLabel="Profil Fotoğrafını Değiştir"
                style={({ pressed: isPressed }) => [
                  styles.avatarPressable,
                  isPressed && styles.pressedScale,
                ]}
              >
                <Avatar size="large" path={me.avatar_path} />
                {uploadAvatar.isPending ? (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="large" color={colors.forest} />
                  </View>
                ) : null}
              </Pressable>
            </View>

            {/* Rol Rozeti (Gönüllü / Yönetici) */}
            {me.role !== "ogrenci" ? (
              <View style={styles.roleChipWrap}>
                <RoleChip role={me.role} />
              </View>
            ) : null}

            {/* Profil Bilgi Satırları */}
            <View style={styles.rowsContainer}>
              {/* 1. İsim Soyisim */}
              <Capsule variant="row">
                <CapsuleLabel text="İsim Soyisim" />
                {isEditing ? (
                  <TextInput
                    autoFocus
                    value={draftName}
                    onChangeText={setDraftName}
                    maxLength={32}
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleSave();
                    }}
                    accessibilityLabel="İsim Soyisim Düzenle"
                    style={[styles.input, styles.inputName]}
                  />
                ) : (
                  <Text style={styles.valueText}>{me.full_name}</Text>
                )}
              </Capsule>

              {/* 2. Giriş Yılı (Gönüllüde gizli) */}
              {!isVolunteer ? (
                <Capsule variant="row">
                  <CapsuleLabel text="Giriş Yılı" />
                  {isEditing ? (
                    <TextInput
                      value={draftYear}
                      onChangeText={setDraftYear}
                      maxLength={4}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void handleSave();
                      }}
                      accessibilityLabel="Giriş Yılı Düzenle"
                      style={[styles.input, styles.inputYear]}
                    />
                  ) : (
                    <Text style={styles.valueText}>{me.class_year ?? "-"}</Text>
                  )}
                </Capsule>
              ) : null}

              {/* 3. Fidanlarım */}
              <Capsule
                variant="row"
                style={[styles.saplingsCapsule, { maxWidth: maxRowWidth }]}
              >
                <CapsuleLabel text="Fidanlarım" />
                {renderSaplingsContent()}
              </Capsule>

              {/* 4. Bölüm (Gönüllüde gizli) */}
              {!isVolunteer ? (
                <Capsule variant="row">
                  <CapsuleLabel text="Bölüm" />
                  {isEditing ? (
                    <TextInput
                      value={draftDepartment}
                      onChangeText={setDraftDepartment}
                      maxLength={34}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void handleSave();
                      }}
                      accessibilityLabel="Bölüm Düzenle"
                      style={[styles.input, styles.inputWide]}
                    />
                  ) : (
                    <Text style={styles.valueText}>{me.department || "-"}</Text>
                  )}
                </Capsule>
              ) : null}

              {/* 5. Okul (Gönüllüde gizli) */}
              {!isVolunteer ? (
                <Capsule
                  variant="row"
                  style={[styles.schoolCapsule, { maxWidth: maxRowWidth }]}
                >
                  <CapsuleLabel text="Okul" />
                  {isEditing ? (
                    <TextInput
                      value={draftSchool}
                      onChangeText={setDraftSchool}
                      maxLength={60}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void handleSave();
                      }}
                      accessibilityLabel="Okul Düzenle"
                      style={[styles.input, styles.inputWide]}
                    />
                  ) : (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.valueText, styles.schoolValue]}
                    >
                      {me.school || "-"}
                    </Text>
                  )}
                </Capsule>
              ) : null}

              {/* 6. Puanım */}
              <Capsule variant="row" onPress={handleOpenLeaderboard}>
                <CapsuleLabel text="Puanım" />
                <Text style={styles.pointsText}>{me.total_points}</Text>
              </Capsule>
            </View>

            {/* Çıkış Yap */}
            <Pressable
              onPress={handleSignOutPress}
              disabled={isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Çıkış yap"
              style={({ pressed: isPressed }) => [
                styles.signOutButton,
                isPressed && styles.signOutPressed,
              ]}
            >
              <Text style={styles.signOutText}>Çıkış yap</Text>
            </Pressable>
          </>
        )}
      </View>
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: 16, // tasarım top-4
    right: 16, // tasarım right-4
    zIndex: 10,
    width: 40, // tasarım w-10
    height: 40, // tasarım h-10
    borderRadius: radius.pill,
    backgroundColor: alpha.forest15,
    borderWidth: 1,
    borderColor: alpha.forest35,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.capsule,
  },
  editButtonActive: {
    backgroundColor: alpha.vine35,
    borderColor: colors.vine,
  },
  editButtonPressed: {
    backgroundColor: alpha.forest25,
    transform: [{ scale: pressed.scale }],
  },
  avatarContainer: {
    marginTop: 12, // tasarım mt-3
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPressable: {
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  pressedScale: {
    transform: [{ scale: pressed.scale }],
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest25,
    alignItems: "center",
    justifyContent: "center",
  },
  roleChipWrap: {
    marginTop: 8, // tasarım 8 px
    alignItems: "center",
  },
  rowsContainer: {
    marginTop: 16, // tasarım mt-4
    width: "100%",
    alignItems: "center",
    gap: 10, // tasarım gap-2.5
  },
  saplingsCapsule: {
    flexWrap: "wrap",
    gap: 8, // tasarım gap-2
  },
  schoolCapsule: {
    flexShrink: 1,
  },
  valueText: {
    ...type.valueBold,
    color: colors.inkMuted,
  },
  schoolValue: {
    flexShrink: 1,
  },
  pointsText: {
    ...type.valueBold,
    color: colors.forest,
  },
  input: {
    ...type.valueBold,
    color: colors.ink,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.vine,
    paddingHorizontal: 8, // tasarım px-2
    paddingVertical: 4, // tasarım py-1
    height: 26, // tasarım 26 px
  },
  inputName: {
    width: 144, // tasarım w-36
  },
  inputYear: {
    width: 96, // tasarım w-24
  },
  inputWide: {
    width: 160, // tasarım w-40
  },
  inlineErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  errorState: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  signOutButton: {
    marginTop: 32, // tasarım 32 px
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signOutPressed: {
    opacity: 0.6,
    transform: [{ scale: pressed.scale }],
  },
  signOutText: {
    ...type.body,
    fontSize: 13, // tasarım Inter 600 13
    fontWeight: "600",
    color: colors.inkMuted,
    textDecorationLine: "underline",
  },
});
