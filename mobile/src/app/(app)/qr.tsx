import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Line,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { treeByQr } from '@/api/saplings';
import { CameraStatusPill, GlassIconButton } from '@/components';
import QrFrame, { QrFrameMode } from '@/features/qr/QrFrame';
import { toMessage } from '@/lib/errors';
import { useModal } from '@/modal';
import { alpha, colors, motion, pressed, radius, type } from '@/theme/theme';

const SCAN_FRAME_SIZE = 236; // tasarım w-[236px]
const SUCCESS_FRAME_SIZE = 152; // tasarım w-[152px]
const REQUEST_TIMEOUT_MS = 8000;
const ERROR_DISPLAY_MS = 1500;
const SAME_ERROR_COOLDOWN_MS = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('İnternet bağlantını kontrol et.'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export default function QrScannerScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const modal = useModal();
  const [permission, requestPermission] = useCameraPermissions();

  const [isFocused, setIsFocused] = useState(true);
  const [mode, setMode] = useState<QrFrameMode>('scanning');
  const [errorCount, setErrorCount] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  const scanLockedRef = useRef(false);
  const lastErrorRef = useRef<{ code: string; at: number } | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const resetScanner = useCallback(() => {
    clearAllTimers();
    scanLockedRef.current = false;
    setMode('scanning');
    setErrorText(null);
  }, [clearAllTimers]);

  // Ekran odaktayken kamerayı aç, çıkınca kapat ve kareyi sıfırla
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        resetScanner();
      };
    }, [resetScanner]),
  );

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const hasPermission = Boolean(permission?.granted);
  const isPermanentlyDenied =
    permission !== null && !permission.granted && !permission.canAskAgain;

  const statusText = useMemo(() => {
    if (!hasPermission) {
      return 'Kamera Kapalı';
    }
    if (mode === 'success') {
      return 'QR Kod Okundu ✓';
    }
    return 'Kamera Açık • QR Taranıyor';
  }, [hasPermission, mode]);

  const guideText = useMemo(() => {
    if (!hasPermission) {
      if (isPermanentlyDenied) {
        return "Kamera izni kapalı — Ayarlar'dan aç";
      }
      return 'Kamerayı açmak için dokun';
    }
    if (mode === 'success') {
      return 'QR kod başarıyla algılandı!';
    }
    if (mode === 'error' && errorText) {
      return errorText;
    }
    return 'QR kodu karenin içine hizalayın';
  }, [errorText, hasPermission, isPermanentlyDenied, mode]);

  const handlePermissionPress = useCallback(async () => {
    if (hasPermission) return;
    Haptics.selectionAsync().catch(() => {});
    if (isPermanentlyDenied) {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  }, [hasPermission, isPermanentlyDenied, requestPermission]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.navigate('/(app)');
  }, []);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const rawData = result.data?.trim();
      if (!rawData || scanLockedRef.current) {
        return;
      }

      const now = Date.now();
      if (
        lastErrorRef.current &&
        lastErrorRef.current.code === rawData &&
        now - lastErrorRef.current.at < SAME_ERROR_COOLDOWN_MS
      ) {
        return;
      }

      // Kilitle + titreşim + başarı animasyonu ve sunucu sorgusu AYNI ANDA başlar
      scanLockedRef.current = true;
      setMode('success');
      setErrorText(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );

      const startedAt = Date.now();

      try {
        const tree = await withTimeout(treeByQr(rawData), REQUEST_TIMEOUT_MS);
        const elapsed = Date.now() - startedAt;
        const minRedirectMs = motion.qrRedirect ?? 950;
        const remaining = Math.max(0, minRedirectMs - elapsed);

        const redirectTimer = setTimeout(() => {
          router.navigate('/(app)/tum-fidanlar');
          modal.open({ name: 'fidan-detay', treeId: tree.id });
        }, remaining);
        timersRef.current.push(redirectTimer);
      } catch (err: unknown) {
        const isTimeout =
          err instanceof Error &&
          err.message === 'İnternet bağlantını kontrol et.';
        const message = isTimeout
          ? 'İnternet bağlantını kontrol et.'
          : toMessage(err);

        lastErrorRef.current = { code: rawData, at: Date.now() };
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );

        // Başarı animasyonunu geri sar (300 ms) ve hata durumuna geç
        setMode('error');
        setErrorText(message);
        setErrorCount((prev) => prev + 1);

        const recoverTimer = setTimeout(() => {
          setMode('scanning');
          setErrorText(null);
          scanLockedRef.current = false;
        }, ERROR_DISPLAY_MS);
        timersRef.current.push(recoverTimer);
      }
    },
    [modal],
  );

  // Kare dışı 4 dikdörtgen maske hesabı (tasarımdaki dev box-shadow karşılığı)
  const holeSize = mode === 'success' ? SUCCESS_FRAME_SIZE : SCAN_FRAME_SIZE;
  const topHeight = Math.max(0, (screenHeight - holeSize) / 2);
  const sideWidth = Math.max(0, (screenWidth - holeSize) / 2);
  const cutoutMaskColor =
    mode === 'success' ? 'rgba(0,0,0,0.48)' : alpha.black42;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Katman 1: Gerçek Kamera (Sadece ekran odaktayken ve izin varsa) */}
      {isFocused && hasPermission && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      {/* Katman 2: Yedek Vizör Zemini (İzin yokken veya kamera yüklenirken) */}
      {(!isFocused || !hasPermission) && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="qrFallbackGlow"
                cx="50%"
                cy="45%"
                rx="65%"
                ry="65%"
              >
                <Stop offset="0%" stopColor="rgba(26,64,28,0.65)" />
                <Stop offset="78%" stopColor="rgba(8,20,9,0.96)" />
                <Stop offset="100%" stopColor="rgba(8,20,9,0.96)" />
              </RadialGradient>
              <Pattern
                id="qrSensorGrid"
                width={44}
                height={44}
                patternUnits="userSpaceOnUse"
              >
                <Line
                  x1={0}
                  y1={0}
                  x2={44}
                  y2={0}
                  stroke="rgba(37,195,0,0.22)"
                  strokeWidth={1}
                />
                <Line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={44}
                  stroke="rgba(37,195,0,0.22)"
                  strokeWidth={1}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#qrFallbackGlow)" />
            <Rect
              width="100%"
              height="100%"
              fill="url(#qrSensorGrid)"
              opacity={0.2}
            />
          </Svg>
        </View>
      )}

      {/* Katman 3: Genel Karartma */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.globalDim]}
      />

      {/* Katman 4: Kare Dışı Karartma (Dört dikdörtgen) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ height: topHeight, backgroundColor: cutoutMaskColor }} />
        <View style={{ height: holeSize, flexDirection: 'row' }}>
          <View style={{ width: sideWidth, backgroundColor: cutoutMaskColor }} />
          <View style={{ width: holeSize }} />
          <View style={{ width: sideWidth, backgroundColor: cutoutMaskColor }} />
        </View>
        <View style={{ flex: 1, backgroundColor: cutoutMaskColor }} />
      </View>

      {/* Katman 5: Üst Çubuk */}
      <View
        style={[
          styles.topBar,
          {
            top: insets.top + 24, // tasarım top-6
          },
        ]}
      >
        <GlassIconButton
          icon="closeX"
          variant="dark"
          onPress={handleClose}
          accessibilityLabel="Kamerayı Kapat"
        />

        <CameraStatusPill text={statusText} />

        <View style={styles.topSpacer} />
      </View>

      {/* Katman 6: Orta Kare ve Alt Yönlendirme Kapsülü */}
      <View style={[StyleSheet.absoluteFill, styles.centerLayer]} pointerEvents="box-none">
        <Pressable
          disabled={hasPermission}
          onPress={handlePermissionPress}
          accessibilityRole={hasPermission ? undefined : 'button'}
          accessibilityLabel={hasPermission ? undefined : 'Kamera izni ver'}
          style={({ pressed: isPressed }) => [
            !hasPermission &&
              isPressed && { transform: [{ scale: pressed.scale }] },
          ]}
        >
          <QrFrame mode={mode} errorCount={errorCount} />
        </Pressable>

        <Pressable
          disabled={hasPermission}
          onPress={handlePermissionPress}
          accessibilityRole={hasPermission ? undefined : 'button'}
          accessibilityLabel={hasPermission ? undefined : guideText}
          style={({ pressed: isPressed }) => [
            styles.guideOuter,
            !hasPermission &&
              isPressed && { transform: [{ scale: pressed.scale }] },
          ]}
        >
          <BlurView intensity={15} tint="dark" style={styles.guidePill}>
            <Text style={[type.guide, styles.guideText]}>{guideText}</Text>
          </BlurView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cameraBg,
  },
  globalDim: {
    backgroundColor: alpha.black30,
  },
  topBar: {
    position: 'absolute',
    left: 16, // tasarım inset-x-4
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    width: 40, // tasarım w-10 h-10
    height: 40,
  },
  centerLayer: {
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideOuter: {
    marginTop: 24, // tasarım mt-6
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: alpha.white15,
    backgroundColor: alpha.black55,
  },
  guidePill: {
    paddingHorizontal: 16, // tasarım px-4
    paddingVertical: 8, // tasarım py-2
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: {
    color: colors.onCamera,
    textAlign: 'center',
  },
});