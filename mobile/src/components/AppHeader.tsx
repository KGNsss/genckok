import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '@/api/me';
import { alpha, colors, radius, size, type } from '@/theme/theme';
import { Icon } from './Icon';
import { PressableScale, resolveAvatarUri } from './internal';

/** Üst bar: sol AR-GE logosu, ortada "GençKök", sağda profil butonu (Profilim'i açar). Sadece (app)/_layout kullanır. */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { data: me } = useMe();
  const onProfile = segments[segments.length - 1] === 'profilim';
  const uri = resolveAvatarUri(me?.avatar_path);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.bar, { paddingTop: insets.top, height: insets.top + size.headerHeight }]}>
        <View style={styles.row}>
          <View style={styles.logo}>
            <Icon name="argeLogo" size={size.headerIcon} />
          </View>

          <View pointerEvents="none" style={styles.center}>
            <Text style={styles.title}>GençKök</Text>
          </View>

          <PressableScale
            onPress={() => router.push('/profilim')}
            accessibilityRole="button"
            accessibilityLabel="Profil"
            scaleTo={onProfile ? 1.05 : undefined}
            style={styles.profileBox}
          >
            {onProfile && <View pointerEvents="none" style={styles.ring} />}
            <View style={[styles.profile, onProfile && styles.profileActive]}>
              {uri ? <Image source={uri} contentFit="cover" style={StyleSheet.absoluteFill} /> : <Icon name="userIcon" size={22} />}
            </View>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // zemin: nane yeşili + üstüne forest20 (durum çubuğu alanı dahil aynı renk)
  backdrop: { backgroundColor: colors.bg },
  bar: { backgroundColor: alpha.forest20, borderBottomWidth: 1, borderBottomColor: alpha.headerBorder, paddingHorizontal: size.screenPadX },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: size.headerIcon, height: size.headerIcon, borderRadius: radius.pill, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.headerLogo, color: colors.ink },
  profileBox: { width: size.headerIcon, height: size.headerIcon },
  profile: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest15,
    borderWidth: 1,
    borderColor: alpha.vine75,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileActive: { backgroundColor: alpha.forest30, borderColor: colors.vine },
  // Profilim açıkken dışta 2 px vine50 halka
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: radius.pill, borderWidth: 2, borderColor: alpha.vine50 },
});
