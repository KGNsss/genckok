// Çizgili kağıt (modal) sağlayıcısı: tek kağıt katmanı, içeriği değişerek açılır. Sahibi: Görev 0.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { LinedPaper } from '@/components/LinedPaper';
import { PressableScale, resolvePhotoUri } from '@/components/internal';
import { alpha, colors, easing, motion, radius, shadow, size } from '@/theme/theme';
import type { ModalApi, ModalView, ModalViewProps } from './types';
import { VIEW_HEIGHT, getViewComponent } from './views';

const ModalContext = createContext<ModalApi>({ open: () => {}, close: () => {}, openFullscreenPhoto: () => {}, current: null });
export const useModal = () => useContext(ModalContext);

const OUT = Easing.bezier(...easing.out);
const HEIGHT_MS = 200;
const EXIT_MS = 200;
const FULLSCREEN_BORDER = 'rgba(37,195,0,0.65)'; // UI şablonu 8.14: tam ekran fotoğraf çerçevesi (theme'de karşılığı yok)
const FULLSCREEN_MAX = 334;

/** Kayıt defterinden kağıt içeriğini bulup çizer (dosya boşsa "YAPIM AŞAMASINDA"). */
function ModalContent(props: ModalViewProps<ModalView['name']>) {
  return createElement(getViewComponent(props.view.name), props);
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const win = useWindowDimensions();
  const [current, setCurrent] = useState<ModalView | null>(null);
  const [shown, setShown] = useState<ModalView | null>(null); // çıkış animasyonu sırasında içerik kalsın
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const currentRef = useRef<ModalView | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const p = useSharedValue(0);      // kağıt + arka plan
  const fp = useSharedValue(0);     // tam ekran fotoğraf
  const h = useSharedValue<number>(size.paperH);

  const open = useCallback(
    (v: ModalView) => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      const wasOpen = currentRef.current != null;
      currentRef.current = v;
      setCurrent(v);
      setShown(v);
      h.set(wasOpen ? withTiming(VIEW_HEIGHT[v.name], { duration: HEIGHT_MS }) : VIEW_HEIGHT[v.name]);
      p.set(withTiming(1, { duration: motion.modal, easing: OUT }));
    },
    [h, p],
  );

  const close = useCallback(() => {
    if (currentRef.current == null) return;
    currentRef.current = null;
    setCurrent(null);
    setFullscreen(null);
    p.set(withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.ease) }));
    fp.set(withTiming(0, { duration: EXIT_MS }));
    exitTimer.current = setTimeout(() => setShown(null), EXIT_MS + 20);
  }, [p, fp]);

  const openFullscreenPhoto = useCallback(
    (path: string) => {
      setFullscreen(path);
      fp.set(0);
      fp.set(withTiming(1, { duration: motion.fullscreen, easing: OUT }));
    },
    [fp],
  );

  // Android geri tuşu: önce tam ekran, sonra kağıt
  useEffect(() => {
    if (current == null) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (fullscreen) {
        setFullscreen(null);
        fp.set(0);
      } else {
        close();
      }
      return true;
    });
    return () => sub.remove();
  }, [current, fullscreen, close, fp]);

  const api = useMemo<ModalApi>(() => ({ open, close, openFullscreenPhoto, current }), [open, close, openFullscreenPhoto, current]);

  const backdrop = useAnimatedStyle(() => ({ opacity: p.value }));
  const paper = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 12 }, { scale: 0.9 + 0.1 * p.value }],
  }));
  const paperBox = useAnimatedStyle(() => ({ height: h.value }));
  const fsAnim = useAnimatedStyle(() => ({ opacity: fp.value, transform: [{ scale: 0.9 + 0.1 * fp.value }] }));

  const fsSize = Math.min(win.width - 32, FULLSCREEN_MAX);
  const fsUri = resolvePhotoUri(fullscreen);

  return (
    <ModalContext.Provider value={api}>
      {children}

      {shown && (
        <View style={styles.overlay} pointerEvents={current ? 'auto' : 'none'}>
          <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha.backdrop }]} />
          </Animated.View>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Kağıdı Kapat" />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center} pointerEvents="box-none">
            <Animated.View style={[{ maxHeight: win.height * 0.78 }, paper, paperBox]}>
              <LinedPaper height="fill" onClose={close}>
                <ModalContent view={shown} close={close} open={open} />
              </LinedPaper>
            </Animated.View>
          </KeyboardAvoidingView>

          {fullscreen && (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha.backdropStrong }]} />
              <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fotoğrafı Kapat" />
              <Animated.View style={[styles.fsBox, { width: fsSize, height: fsSize }, shadow.paper, fsAnim]}>
                <View style={styles.fsClip}>{fsUri ? <Image source={fsUri} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}</View>
                <PressableScale onPress={close} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.fsClose}>
                  <Icon name="closeX" size={20} color={colors.forest} />
                </PressableScale>
              </Animated.View>
            </View>
          )}
        </View>
      )}
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 50, elevation: 50 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  fsBox: { borderRadius: radius.xl },
  fsClip: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.cardBlue,
    borderWidth: 2,
    borderColor: FULLSCREEN_BORDER,
  },
  fsClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest25,
    borderWidth: 1,
    borderColor: alpha.forest45,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
