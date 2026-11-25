// Sayfa 5 · Kamera (tam ekran). Sahibi: Görev 6.
// Çekilen fotoğraf arka planda yüklenir (yönetici onayından sonra galeride görünür),
// küçülerek sol alttaki galeri butonuna "uçar".
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View, useWindowDimensions, type HostInstance } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { CameraStatusPill, GlassIconButton, Icon } from '@/components';
import { PressableScale } from '@/components/internal';
import { useUploadQueue } from '@/features/kamera/useUploadQueue';
import { trUpper } from '@/lib/format';
import { SVG } from '@/theme/svg';
import { alpha, colors, easing, motion, pressed, radius, shadow, size, type } from '@/theme/theme';

const OUT = Easing.bezier(...easing.out);
const FLASH_FILLED = SVG.flash.replace('fill="none"', 'fill="currentColor"');

export default function Kamera() {
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const { treeId, label } = useLocalSearchParams<{ treeId?: string; label?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { enqueue, pending, uploading } = useUploadQueue();

  const cameraRef = useRef<CameraView>(null);
  const galleryRef = useRef<HostInstance>(null);
  const capturing = useRef(false);

  const [focused, setFocused] = useState(true);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [thumb, setThumb] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [flyUri, setFlyUri] = useState<string | null>(null);

  // Sekmeden çıkınca kamera kapansın (pil)
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const granted = !!permission?.granted;
  const canAsk = permission?.canAskAgain ?? true;

  // ---------- animasyon değerleri ----------
  const inner = useSharedValue(1);      // deklanşör iç dairesi
  const flash = useSharedValue(0);      // beyaz flaş patlaması
  const spin = useSharedValue(0);       // kamera çevir ikonu (derece)
  const fly = useSharedValue(0);        // uçuş ilerlemesi 0→1
  const flyFade = useSharedValue(1);
  const target = useSharedValue<{ x: number; y: number; w: number; h: number }>({ x: 28, y: win.height - 120, w: size.cameraSide, h: size.cameraSide });

  const innerStyle = useAnimatedStyle(() => ({ transform: [{ scale: inner.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const flyStyle = useAnimatedStyle(() => {
    const t = target.value;
    const p = fly.value;
    return {
      left: t.x * p,
      top: t.y * p,
      width: win.width + (t.w - win.width) * p,
      height: win.height + (t.h - win.height) * p,
      borderRadius: 24 - 8 * p,
      opacity: flyFade.value,
    };
  });

  // ---------- eylemler ----------
  const close = () => router.navigate('/(app)');
  const openGallery = () => router.navigate('/(app)/galeri');

  const askPermission = async () => {
    if (canAsk) await requestPermission();
    else await Linking.openSettings();
  };

  const toggleFlash = () => {
    Haptics.selectionAsync().catch(() => {});
    setFlashOn((v) => !v);
  };

  const switchFacing = () => {
    Haptics.selectionAsync().catch(() => {});
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
    spin.set(withTiming(spin.value === 0 ? 180 : 0, { duration: 300, easing: OUT }));
  };

  const capture = async () => {
    if (capturing.current || !granted || !cameraRef.current) return;
    capturing.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // 1) iç daire bas-bırak  2) flaş patlaması
    inner.set(withSequence(withTiming(0.75, { duration: 80 }), withTiming(1, { duration: 80 })));
    flash.set(flashOn ? 0.96 : 0.68);
    setTimeout(() => flash.set(withTiming(0, { duration: 200 })), flashOn ? 220 : 120);

    try {
      // 3) fotoğraf
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error('foto yok');

      // 4) uçuş: tam ekrandan galeri butonuna
      galleryRef.current?.measureInWindow((x, y, w, h) => {
        target.set({ x, y, w, h });
        fly.set(0);
        flyFade.set(1);
        setFlyUri(photo.uri);
        fly.set(withTiming(1, { duration: motion.photoFly, easing: OUT }));
      });
      setTimeout(() => {
        flyFade.set(withTiming(0, { duration: 140 }));
        setTimeout(() => setFlyUri(null), 150);
        // 5) küçük resim + sayaç
        setThumb(photo.uri);
        setSessionCount((n) => n + 1);
        capturing.current = false;
      }, motion.photoFly);

      // 6) arka planda yükle
      enqueue({ localUri: photo.uri, treeId: treeId ?? null });
    } catch {
      capturing.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const statusText = !granted
    ? 'Kamera Kapalı'
    : label
      ? `Kamera Açık • ${trUpper(label)} için`
      : facing === 'back'
        ? 'Kamera Açık • Arka'
        : 'Kamera Açık • Ön';

  const grid = useMemo(
    () => (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.grid]}>
        <View style={[styles.gridLineV, { left: '33.333%' }]} />
        <View style={[styles.gridLineV, { left: '66.666%' }]} />
        <View style={[styles.gridLineH, { top: '33.333%' }]} />
        <View style={[styles.gridLineH, { top: '66.666%' }]} />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 1 · Kamera (sadece odaktayken ve izin varken) */}
      {focused && granted && (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} enableTorch={flashOn} mode="picture" />
      )}

      {/* 2 · Yedek zemin (izin yokken) */}
      {!granted && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="kameraZemin" cx="50%" cy="42%" r="80%">
                <Stop offset="0%" stopColor="rgb(28,74,31)" stopOpacity={0.72} />
                <Stop offset="100%" stopColor="rgb(7,20,8)" stopOpacity={0.97} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#kameraZemin)" />
          </Svg>
        </View>
      )}

      {/* 3 · 3×3 kompozisyon ızgarası */}
      {grid}

      {/* 4 · Flaş patlaması */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />

      {/* İzin yokken ortadaki kapsül */}
      {!granted && permission && (
        <View style={styles.centerWrap} pointerEvents="box-none">
          <PressableScale onPress={askPermission} accessibilityRole="button" style={styles.guidePill}>
            <Text style={styles.guideText}>
              {canAsk ? 'Kamerayı açmak için dokun' : "Kamera izni kapalı — Ayarlar'dan aç"}
            </Text>
          </PressableScale>
        </View>
      )}

      {/* 5 · Üst çubuk */}
      <View style={[styles.topBar, { top: insets.top + 24 }]}>
        <GlassIconButton icon="closeX" variant="green" onPress={close} accessibilityLabel="Kamerayı Kapat" />
        <CameraStatusPill text={statusText} />
        <PressableScale
          onPress={toggleFlash}
          accessibilityRole="button"
          accessibilityLabel="Flaş"
          accessibilityState={{ selected: flashOn }}
          style={[styles.flashBtn, flashOn && styles.flashBtnOn]}
        >
          <SvgXml xml={flashOn ? FLASH_FILLED : SVG.flash} width={20} height={20} color={colors.vine} />
          {!flashOn && <View pointerEvents="none" style={styles.flashSlash} />}
        </PressableScale>
      </View>

      {/* 6 · Alt çubuk */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 36 }]}>
        {/* Galeri butonu */}
        <PressableScale onPress={openGallery} accessibilityRole="button" accessibilityLabel="Galeri" style={styles.galleryShadow}>
          <View ref={galleryRef} collapsable={false} style={styles.gallery}>
            {thumb ? (
              <Image source={thumb} contentFit="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <Icon name="galleryIcon" size={24} color={colors.vine} />
            )}
          </View>
          {sessionCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{sessionCount}</Text>
              {uploading && pending > 0 && <ActivityIndicator size={10} color={colors.ink} style={{ marginLeft: 3 }} />}
            </View>
          )}
        </PressableScale>

        {/* Deklanşör */}
        <PressableScale
          onPress={capture}
          disabled={!granted}
          scaleTo={pressed.scaleStrong}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf Çek"
          style={[styles.shutter, !granted && { opacity: 0.4 }]}
        >
          <Animated.View style={[styles.shutterInner, innerStyle]} />
        </PressableScale>

        {/* Kamera çevir */}
        <PressableScale onPress={switchFacing} accessibilityRole="button" accessibilityLabel="Ön / Arka Kamera Değiştir" style={styles.switchBtn}>
          <Animated.View style={spinStyle}>
            <Icon name="switchCamera" size={24} color={colors.vine} />
          </Animated.View>
        </PressableScale>
      </View>

      {/* Uçan fotoğraf */}
      {flyUri && (
        <Animated.View pointerEvents="none" style={[styles.fly, flyStyle]}>
          <Image source={flyUri} contentFit="cover" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg },
  grid: { opacity: 0.2 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: alpha.white40 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: alpha.white40 },
  flash: { backgroundColor: colors.white, zIndex: 30 },
  centerWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  guidePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: alpha.black55,
    borderWidth: 1,
    borderColor: alpha.white15,
  },
  guideText: { ...type.guide, color: colors.onCamera, textAlign: 'center' },
  topBar: {
    position: 'absolute',
    left: size.screenPadX,
    right: size.screenPadX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  flashBtn: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha.forest35,
    backgroundColor: alpha.forest20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnOn: {
    backgroundColor: alpha.forest45,
    borderColor: colors.vine,
    shadowColor: colors.vine,
    shadowOpacity: 0.9,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  // flaş kapalıyken ikonun üstündeki çapraz çizgi (24×2, 45°)
  flashSlash: { position: 'absolute', width: 24, height: 2, borderRadius: radius.pill, backgroundColor: colors.vine, transform: [{ rotate: '45deg' }] },
  bottomBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  galleryShadow: { width: size.cameraSide, height: size.cameraSide, borderRadius: radius.cardLg, ...shadow.camera },
  gallery: {
    flex: 1,
    borderRadius: radius.cardLg,
    overflow: 'hidden',
    backgroundColor: alpha.forest20,
    borderWidth: 2,
    borderColor: alpha.forest45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.vine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...type.badge, color: colors.ink },
  shutter: {
    width: size.shutter,
    height: size.shutter,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest20,
    borderWidth: 4,
    borderColor: colors.vine,
    padding: 6,
    ...shadow.camera,
  },
  shutterInner: { flex: 1, borderRadius: radius.pill, backgroundColor: colors.vine },
  switchBtn: {
    width: size.cameraSide,
    height: size.cameraSide,
    borderRadius: radius.pill,
    backgroundColor: alpha.forest20,
    borderWidth: 1,
    borderColor: alpha.forest35,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.camera,
  },
  fly: { position: 'absolute', overflow: 'hidden', borderWidth: 2, borderColor: colors.vine, zIndex: 50, ...shadow.camera },
});
