import { StyleSheet, Text, View } from 'react-native';
import type { PhotoStatus, Role } from '@/api/types';
import { alpha, colors, radius, shadow, type } from '@/theme/theme';
import { diacriticRoom } from './internal';

/** 'gonullu' → GÖNÜLLÜ, 'admin' → YÖNETİCİ, 'ogrenci' → hiçbir şey çizilmez. */
export function RoleChip({ role }: { role: Role }) {
  if (role === 'ogrenci') return null;
  return (
    <View style={[styles.chip, role === 'admin' && { backgroundColor: alpha.vine25 }]}>
      <Text style={[styles.chipText, diacriticRoom]}>{role === 'admin' ? 'YÖNETİCİ' : 'GÖNÜLLÜ'}</Text>
    </View>
  );
}

/** 'beklemede' → ONAY BEKLİYOR, 'reddedildi' → REDDEDİLDİ, 'onaylandi' → hiçbir şey çizilmez. Yerleşimi kullanan yapar. */
export function PhotoStatusBadge({ status }: { status: PhotoStatus }) {
  if (status === 'onaylandi') return null;
  const waiting = status === 'beklemede';
  return (
    <View style={[styles.badge, { backgroundColor: waiting ? alpha.black55 : colors.heart }]}>
      <Text style={[styles.badgeText, { color: waiting ? colors.onCamera : colors.white }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {waiting ? 'ONAY BEKLİYOR' : 'REDDEDİLDİ'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // UI şablonu 8.16: kapsül iç boşluk 10 / 2
  chip: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest15,
    ...shadow.chip,
  },
  chipText: { ...type.cardNameSmall, color: colors.ink },
  // iç boşluk 8 / 3
  badge: { alignSelf: 'flex-start', flexShrink: 1, maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { ...type.badge },
});
