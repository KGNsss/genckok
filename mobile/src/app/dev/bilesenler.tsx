// Bileşen vitrini (sadece geliştirme): tüm ortak bileşenler tüm durumlarıyla. Sahibi: Görev 0.
// Açmak için: /dev/bilesenler (tarayıcıda ya da `router.push('/dev/bilesenler')`).
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar, CameraStatusPill, Capsule, CapsuleLabel, CircleButton, EmptyNote, GlassIconButton, LinedPaper, PaperButtonRow,
  PaperInput, PaperRow, PaperTitleRow, PaperValue, PhotoStatusBadge, PhotoTile, PillButton, PulseBox, RoleChip, SaplingCard,
  ToastProvider, useToast, WoodBanner,
} from '@/components';
import { WoodTabButton } from '@/components/WoodTabBar';
import type { CapsuleVariant } from '@/components';
import { ModalProvider, useModal } from '@/modal/ModalHost';
import { colors, fonts, size, type } from '@/theme/theme';

const PHOTO = 'https://picsum.photos/400/500'; // sadece vitrinde: tam adres verilirse Storage yerine bu kullanılır
const VARIANTS: CapsuleVariant[] = ['title', 'name', 'chip', 'chipSmall'];

function Section({ title, children, dark }: { title: string; children: ReactNode; dark?: boolean }) {
  return (
    <View style={[styles.section, dark && styles.dark]}>
      <Text style={[styles.sectionTitle, dark && { color: colors.onCamera }]}>{title}</Text>
      <View style={styles.items}>{children}</View>
    </View>
  );
}

function Vitrin() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const modal = useModal();

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: size.screenPadX, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, gap: 20 }}>
      <Text style={styles.h1}>GençKök · Bileşen vitrini</Text>

      <Section title="Capsule">
        {VARIANTS.map((v) => <Capsule key={v} variant={v} text={v === 'name' ? 'AĞACCIK' : `variant=${v}`} onPress={v === 'chip' ? () => toast.show('Çip basıldı') : undefined} />)}
        <Capsule variant="row"><CapsuleLabel text="İsim Soyisim" /><Text style={type.valueBold}>Jinx</Text></Capsule>
        <Capsule variant="rowSmall"><CapsuleLabel small text="Bölüm" /><Text style={type.publicValue}>Yazılım Mühendisliği</Text></Capsule>
      </Section>

      <Section title="SaplingCard (lg / sm, fotoğraflı ve fotoğrafsız)">
        <SaplingCard size="lg" label="Ağaccık" coverPath={PHOTO} onPress={() => toast.show('Büyük kart')} />
        <SaplingCard size="lg" label="Fidancık" coverPath={null} />
        <SaplingCard size="sm" label="Groot" coverPath={PHOTO} />
        <SaplingCard size="sm" label="Miku" coverPath={null} />
      </Section>

      <Section title="PhotoTile (onaylı · beklemede · reddedildi)">
        <PhotoTile size={78} path={PHOTO} />
        <PhotoTile size={78} path={PHOTO} status="beklemede" />
        <PhotoTile size={78} path={PHOTO} status="reddedildi" />
        <PhotoTile size={78} path={null} />
      </Section>

      <Section title="Rozetler">
        <RoleChip role="gonullu" />
        <RoleChip role="admin" />
        <RoleChip role="ogrenci" />
        <PhotoStatusBadge status="beklemede" />
        <PhotoStatusBadge status="reddedildi" />
      </Section>

      <Section title="CircleButton (artı 50 / 40) ve PillButton">
        <CircleButton icon="plus" size={50} onPress={() => toast.show('+ (50)')} />
        <CircleButton icon="plus" size={40} onPress={() => toast.show('+ (40)')} />
        <CircleButton icon="plus" size={40} disabled onPress={() => {}} />
        <PillButton size="md" label="EKLE" onPress={() => toast.show('EKLE')} />
        <PillButton size="md" label="EKLE" loading onPress={() => {}} />
        <PillButton size="md" label="EKLE" disabled onPress={() => {}} />
      </Section>

      <Section title="WoodBanner (grain / plain) — tam genişlik">
        <View style={styles.bleed}>
          <WoodBanner variant="grain"><Text style={type.bannerTitle}>GÜNÜN SÖZÜ</Text></WoodBanner>
          <View style={{ height: 12 }} />
          <WoodBanner variant="plain"><Text style={[type.banner, { color: colors.ink, textAlign: 'center' }]}>Fidan ekleyerek ve fotoğraf paylaşarak puan topla, ormandaki yerini gör.</Text></WoodBanner>
        </View>
      </Section>

      <Section title="Avatar (header · large · paper · mini; fotoğraflı / fotoğrafsız)">
        <Avatar size="header" path={null} />
        <Avatar size="header" path={PHOTO} />
        <Avatar size="mini" path={null} />
        <Avatar size="mini" path={PHOTO} />
        <Avatar size="paper" path={null} />
        <Avatar size="paper" path={PHOTO} />
        <Avatar size="large" path={null} />
        <Avatar size="large" path={PHOTO} />
      </Section>

      <Section title="LinedPaper (inline): başlık + 3 satır + buton">
        <LinedPaper mode="inline">
          <PaperTitleRow text="FİDAN EKLE" />
          <PaperRow label="İsim"><PaperInput placeholder="GROOT" maxLength={20} autoCapitalize="characters" /></PaperRow>
          <PaperRow label="Sahibi"><PaperValue text="Jinx" /><Avatar size="mini" path={null} /></PaperRow>
          <PaperRow label="Dikim Tarihi"><PaperInput placeholder="GG.AA.YYYY" keyboardType="number-pad" maxLength={10} /></PaperRow>
          <PaperButtonRow><PillButton size="md" label="EKLE" onPress={() => toast.show('EKLE')} /></PaperButtonRow>
        </LinedPaper>
      </Section>

      <Section title="Kamera parçaları (koyu zemin)" dark>
        <CameraStatusPill text="Kamera Açık • Arka" />
        <GlassIconButton icon="closeX" variant="dark" onPress={() => {}} accessibilityLabel="Kapat" />
        <GlassIconButton icon="flash" variant="green" onPress={() => {}} accessibilityLabel="Flaş" />
        <GlassIconButton icon="flash" variant="green" active onPress={() => {}} accessibilityLabel="Flaş (açık)" />
      </Section>

      <Section title="Toast, PulseBox, EmptyNote">
        <PillButton size="md" label="TOAST" onPress={() => toast.show('Kaydedildi')} />
        <PillButton size="md" label="HATA" onPress={() => toast.show('Bir şeyler ters gitti, tekrar dene.', 'error')} />
        <PulseBox width={120} height={30} radius={999} />
        <PulseBox width={78} height={116} />
        <EmptyNote text="Henüz başka kimse fotoğraf paylaşmadı." />
      </Section>

      <Section title="Sekme butonları (6 odun dilimi, 3. seçili)">
        <View style={styles.tabs}>
          {[0, 1, 2, 3, 4, 5].map((i) => <WoodTabButton key={i} index={i} selected={i === 2} onPress={() => toast.show(`Sekme ${i + 1}`)} />)}
        </View>
      </Section>

      <Section title="Kağıtlar (modal) ve tam ekran fotoğraf">
        <Capsule variant="chip" text="fidan-ekle" onPress={() => modal.open({ name: 'fidan-ekle' })} />
        <Capsule variant="chip" text="gunun-sozu" onPress={() => modal.open({ name: 'gunun-sozu' })} />
        <Capsule variant="chip" text="fidan-detay" onPress={() => modal.open({ name: 'fidan-detay', treeId: 'yok' })} />
        <Capsule variant="chip" text="foto-detay" onPress={() => modal.open({ name: 'foto-detay', photoId: 'yok' })} />
        <Capsule variant="chip" text="kullanici-profili" onPress={() => modal.open({ name: 'kullanici-profili', userId: 'yok' })} />
        <Capsule variant="chip" text="tam ekran foto" onPress={() => modal.openFullscreenPhoto(PHOTO)} />
      </Section>
    </ScrollView>
  );
}

export default function Bilesenler() {
  return (
    <ToastProvider>
      <ModalProvider>
        <Vitrin />
      </ModalProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  h1: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
  section: { gap: 10 },
  dark: { backgroundColor: colors.cameraBg, padding: 12, borderRadius: 16 },
  sectionTitle: { ...type.tiny, color: colors.inkMuted },
  items: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 },
  bleed: { marginHorizontal: -size.screenPadX, width: '100%' as const, alignSelf: 'stretch' },
  tabs: { flexDirection: 'row', gap: 10, paddingTop: 6, paddingBottom: 24 },
});
