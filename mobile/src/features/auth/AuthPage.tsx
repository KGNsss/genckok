// Giriş / Kayıt / Şifre ekranlarının ortak iskeleti. Sahibi: Görev 2.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, LinedPaper, PostItTitle } from '@/components';
import { PressableScale } from '@/components/internal';
import { colors, fonts, size, type } from '@/theme/theme';

type AuthLinkItem = { label: string; onPress: () => void };

type AuthPageProps = {
  /** Post-it başlık: "Giriş Yap", "Kayıt Ol"… */
  title: string;
  /** Kağıdın satırları (PaperTitleRow, PaperRow, …). */
  children: ReactNode;
  /** Kağıdın altındaki bağlantılar. */
  links?: AuthLinkItem[];
};

const TOP_GAP = 84; // pageTop.siralama ile aynı

/** Nane zemin, sol üstte post-it başlık, logo, sayfaya gömülü çizgili kağıt ve altında bağlantılar. */
export function AuthPage({ title, children, links }: AuthPageProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingTop: insets.top + TOP_GAP, paddingBottom: insets.bottom + 32, paddingHorizontal: size.screenPadX }}
        >
          <View style={styles.brand}>
            <Icon name="argeLogo" size={56} />
            <Text style={styles.brandText}>GençKök</Text>
          </View>

          <View style={{ height: 20 }} />
          <LinedPaper mode="inline">{children}</LinedPaper>

          {links && links.length > 0 && (
            <View style={styles.links}>
              {links.map((l) => (
                <AuthLink key={l.label} label={l.label} onPress={l.onPress} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* post-it başlık, güvenli alanın altından başlar */}
      <View pointerEvents="none" style={[styles.postIt, { top: insets.top }]}>
        <PostItTitle text={title} />
      </View>
    </View>
  );
}

/** Altı çizili bağlantı metni (Inter 600 13, forest; basılıyken opaklık 0.6). */
function AuthLink({ label, onPress }: AuthLinkItem) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="link" accessibilityLabel={label} scaleTo={1} style={styles.link} pressedStyle={{ opacity: 0.6 }}>
      <Text style={styles.linkText}>{label}</Text>
    </PressableScale>
  );
}

/** Form hatası: kağıdın satır düzenini bozmaz (48 yükseklik, sol 48). `text` boşsa hiç çizilmez. */
export function PaperError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.errorRow}>
      <Text style={styles.errorText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

/** Çizgilerin üstüne oturan tek satırlık açıklama (type.paperLabel). */
export function PaperNote({ text }: { text: string }) {
  return (
    <View style={styles.noteRow}>
      <Text style={styles.noteText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  postIt: { position: 'absolute', left: 0, right: 0 },
  brand: { alignItems: 'center', gap: 8 },
  brandText: { ...type.headerLogo, fontSize: 22, lineHeight: 26, color: colors.ink },
  links: { alignItems: 'center', gap: 10, marginTop: 16 },
  link: { paddingVertical: 4, paddingHorizontal: 8 },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 17, color: colors.forest, textDecorationLine: 'underline' },
  errorRow: { height: size.paperRow, paddingLeft: size.paperMarginLeft, paddingRight: 20, paddingBottom: 5, justifyContent: 'flex-end' },
  errorText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 14, color: colors.danger },
  noteRow: { height: size.paperRow, paddingLeft: size.paperMarginLeft, paddingRight: 20, paddingBottom: 5, justifyContent: 'flex-end' },
  noteText: { ...type.paperLabel, color: colors.ink },
});
