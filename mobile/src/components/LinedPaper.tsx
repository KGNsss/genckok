import { useState, type ReactNode, type Ref } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type TextInputProps, type TextStyle } from 'react-native';
import { alpha, colors, fonts, radius, shadow, size, type } from '@/theme/theme';
import { Icon } from './Icon';
import { PressableScale, diacriticRoom } from './internal';

const ROW = size.paperRow;       // 48
const HEADER = size.paperHeader; // 56
const LINE_FIRST = 102.5;        // başlık bandından (56) sonra her satırın 46.5. pikseli
const LINE_W = 1.5;

type LinedPaperProps = {
  /** modal: sabit yükseklik (varsayılan 520; ekranın en fazla %78'i), içerik uzarsa kayar. inline: içeriğe göre uzar.
   *  'fill': üstündeki kabın yüksekliğini alır (ModalHost yükseklik animasyonu için). */
  height?: number | 'fill';
  mode?: 'modal' | 'inline';
  onClose?: () => void;
  children: ReactNode;
};

/** Çizgili defter kağıdı kabuğu. İçerik dosyaları bunu sarmaz; sadece PaperRow vb. satırları döner. */
export function LinedPaper({ height, mode = 'modal', onClose, children }: LinedPaperProps) {
  const win = useWindowDimensions();
  const width = Math.min(size.paperW, win.width * 0.94);
  const inline = mode === 'inline';
  const fill = height === 'fill';
  const [fillH, setFillH] = useState<number>(size.paperH);
  const shellH = inline ? undefined : fill ? fillH : Math.min(height ?? size.paperH, win.height * 0.78);
  const [contentH, setContentH] = useState(0);

  // çizgiler kaydırılan içeriğin arkasında, içerik (ya da kabuk) yüksekliği kadar çizilir
  const total = Math.max(contentH + HEADER, shellH ?? 0);
  const lineCount = Math.max(0, Math.floor((total - LINE_FIRST) / ROW) + 1);
  const holesH = shellH ?? total;

  const body = (
    <View onLayout={(e) => setContentH(e.nativeEvent.layout.height)} style={{ paddingTop: HEADER, minHeight: shellH }}>
      {/* satır çizgileri */}
      {Array.from({ length: lineCount }, (_, k) => (
        <View key={k} pointerEvents="none" style={[styles.line, { top: LINE_FIRST + ROW * k }]} />
      ))}
      {children}
    </View>
  );

  return (
    <View
      onLayout={fill ? (e) => setFillH(e.nativeEvent.layout.height) : undefined}
      style={[styles.shell, shadow.paper, { width }, fill ? { flex: 1 } : shellH != null && { height: shellH }]}
    >
      <View style={styles.clip}>
        {inline ? (
          body
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
            {body}
          </ScrollView>
        )}

        {/* başlık bandı: içerik altından kayar */}
        <View pointerEvents="box-none" style={styles.headerBand}>
          <View pointerEvents="box-none" style={styles.headerInner}>
            {!inline && (
              <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.close} pressedStyle={{ backgroundColor: alpha.forest25 }}>
                <Icon name="closeX" size={16} color={colors.ink} />
              </PressableScale>
            )}
          </View>
        </View>

        {/* defter kenar çizgisi ve delikler (kaymaz) */}
        <View pointerEvents="none" style={styles.margin} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} pointerEvents="none" style={[styles.hole, { top: 32 + ((holesH - 64 - 12) / 3) * i }]} />
        ))}
      </View>
    </View>
  );
}

// ---------------- Satırlar (hepsi 48 yükseklik; sol 48 / sağ 20 / alt 5) ----------------

export function PaperTitleRow({ text }: { text: string }) {
  return (
    <View style={[styles.row, { justifyContent: 'center' }]}>
      <Text style={[styles.title, diacriticRoom]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export function PaperRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, diacriticRoom]}>{`${label}:`}</Text>
      <View style={styles.rowBody}>{children}</View>
    </View>
  );
}

/** `ref` verilebilir (klavyede "next" ile sıradaki alana geçmek için). */
export function PaperInput(props: TextInputProps & { ref?: Ref<TextInput> }) {
  return (
    <TextInput
      placeholderTextColor={alpha.forest45}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function PaperValue({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.value, style]} numberOfLines={1}>{text}</Text>;
}

export function PaperSpacer({ rows }: { rows: number }) {
  return <View style={{ height: ROW * rows }} />;
}

export function PaperButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: alpha.forest45,
  },
  clip: { flex: 1, overflow: 'hidden', borderRadius: radius.cardLg },
  line: { position: 'absolute', left: 0, right: 0, height: LINE_W, backgroundColor: alpha.paperLine },
  margin: { position: 'absolute', top: 0, bottom: 0, left: size.paperMarginLine, width: LINE_W, backgroundColor: alpha.forest45 },
  hole: {
    position: 'absolute',
    left: 14,
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: alpha.paperHole,
    borderWidth: 1,
    borderColor: alpha.forest40,
  },
  headerBand: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER, backgroundColor: colors.paper },
  headerInner: {
    position: 'absolute',
    top: 0,
    left: size.paperMarginLeft,
    right: 14,
    height: HEADER,
    borderBottomWidth: 2,
    borderBottomColor: alpha.forest45,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  close: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: alpha.forest15, alignItems: 'center', justifyContent: 'center' },
  row: {
    height: ROW,
    paddingLeft: size.paperMarginLeft,
    paddingRight: 20,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  title: { ...type.paperTitle, color: colors.ink, textAlign: 'center' },
  label: { ...type.paperLabel, color: colors.ink },
  value: { ...type.value, color: colors.inkMuted, flex: 1 },
  input: { ...type.value, color: colors.inkMuted, flex: 1, height: 30, padding: 0, fontFamily: fonts.bodySemi },
  buttonRow: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
