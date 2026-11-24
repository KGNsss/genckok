// Galeri - Kullanıcı Profil Kağıdı
import { StyleSheet, Text, View } from 'react-native';
import { usePublicProfile } from '@/api/profiles';
import { Avatar, Capsule, CapsuleLabel, EmptyNote, PulseBox, RoleChip } from '@/components';
import { toMessage } from '@/lib/errors';
import { trUpper } from '@/lib/format';
import type { ModalViewProps } from '@/modal';
import { colors, radius, type } from '@/theme/theme';

export default function KullaniciProfiliKagidi({ view, open }: ModalViewProps<'kullanici-profili'>) {
  const { data: profile, isLoading, error } = usePublicProfile(view.userId);

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <EmptyNote text={toMessage(error)} />
      </View>
    );
  }

  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <PulseBox width={80} height={80} radius={radius.pill} />
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((key) => (
            <PulseBox key={key} width={200} height={28} radius={radius.pill} />
          ))}
        </View>
      </View>
    );
  }

  const showStudentFields = !(
    profile.role === 'gonullu' &&
    !profile.class_year &&
    !profile.department &&
    !profile.school
  );

  return (
    <View style={styles.container}>
      {/* Profil Avatarı */}
      <Avatar size="paper" path={profile.avatar_path} />

      {/* Rol Çipi (Sadece gönüllü veya admin) */}
      {profile.role !== 'ogrenci' ? (
        <View style={styles.roleChipWrap}>
          <RoleChip role={profile.role} />
        </View>
      ) : null}

      {/* Profil Bilgi Satırları */}
      <View style={styles.listWrap}>
        {/* 1. İsim Soyisim */}
        <Capsule variant="rowSmall" style={styles.rowCapsule}>
          <CapsuleLabel small text="İsim Soyisim" />
          <Text style={styles.valueText} numberOfLines={1}>
            {profile.full_name}
          </Text>
        </Capsule>

        {/* 2. Giriş Yılı */}
        {showStudentFields ? (
          <Capsule variant="rowSmall" style={styles.rowCapsule}>
            <CapsuleLabel small text="Giriş Yılı" />
            <Text style={styles.valueText} numberOfLines={1}>
              {profile.class_year ? String(profile.class_year) : '-'}
            </Text>
          </Capsule>
        ) : null}

        {/* 3. Fidanlarım */}
        <Capsule variant="rowSmall" style={styles.rowCapsule}>
          <CapsuleLabel small text="Fidanlarım" />
          {profile.saplings && profile.saplings.length > 0 ? (
            profile.saplings.map((sapling) => (
              <Capsule
                key={sapling.id}
                variant="chipSmall"
                text={trUpper(sapling.label)}
                onPress={() => open({ name: 'fidan-detay', treeId: sapling.id })}
              />
            ))
          ) : (
            <Text style={styles.valueText}>-</Text>
          )}
        </Capsule>

        {/* 4. Bölüm */}
        {showStudentFields ? (
          <Capsule variant="rowSmall" style={styles.rowCapsule}>
            <CapsuleLabel small text="Bölüm" />
            <Text style={styles.valueText} numberOfLines={1}>
              {profile.department ?? '-'}
            </Text>
          </Capsule>
        ) : null}

        {/* 5. Okul */}
        {showStudentFields ? (
          <Capsule variant="rowSmall" style={styles.rowCapsule}>
            <CapsuleLabel small text="Okul" />
            <Text style={styles.valueText} numberOfLines={1}>
              {profile.school ?? '-'}
            </Text>
          </Capsule>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 48,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    paddingVertical: 32,
  },
  roleChipWrap: {
    marginTop: 8,
  },
  listWrap: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  rowCapsule: {
    maxWidth: '100%',
    alignSelf: 'center',
  },
  valueText: {
    ...type.publicValue,
    color: colors.inkSoft,
    flexShrink: 1,
  },
  skeletonList: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
});
