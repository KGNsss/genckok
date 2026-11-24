import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors, easing, radius } from '@/theme/theme';

export type QrFrameMode = 'scanning' | 'success' | 'error';

type QrFrameProps = {
  mode: QrFrameMode;
  errorCount: number;
};

const FRAME_SCAN_SIZE = 236; // tasarım w-[236px] h-[236px]
const FRAME_SUCCESS_SIZE = 152; // tasarım w-[152px] h-[152px]
const CORNER_SIZE = 44; // tasarım w-11 h-11
const CORNER_BORDER = 4; // tasarım border-[4px]
const CORNER_RADIUS = 24; // tasarım rounded-3xl (radius.xl)

const EASE_OUT = Easing.bezier(
  easing.out[0],
  easing.out[1],
  easing.out[2],
  easing.out[3],
);

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function QrFrame({ mode, errorCount }: QrFrameProps) {
  // Kare boyut ve stil değerleri
  const boxSize = useSharedValue(FRAME_SCAN_SIZE);
  const boxRadius = useSharedValue(CORNER_RADIUS);
  const boxBorderWidth = useSharedValue(0);
  const boxBgOpacity = useSharedValue(0.04);
  const boxShadowOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  // Tarama ışığı ve merkez artı
  const beamTop = useSharedValue(12); // tasarım top: 12px
  const beamOpacity = useSharedValue(0.75);
  const guidesOpacity = useSharedValue(1);

  // Köşe parantezleri
  const cornerOpacity = useSharedValue(1);
  const cornerScale = useSharedValue(1);
  const cornerErrorActive = useSharedValue(0);

  // Başarı tiki
  const checkScale = useSharedValue(0.6);
  const checkOpacity = useSharedValue(0);
  const tickDashOffset = useSharedValue(80);

  // Sürekli tarama ışığı döngüsü (2200 ms: 1100 ms aşağı, 1100 ms yukarı)
  useEffect(() => {
    beamTop.value = withRepeat(
      withSequence(
        withTiming(FRAME_SCAN_SIZE - 14, {
          duration: 1100, // tasarım 2.2s yarısı
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(12, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    beamOpacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.75, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(beamTop);
      cancelAnimation(beamOpacity);
    };
  }, [beamOpacity, beamTop]);

  // Tarama <-> Başarı geçişleri
  useEffect(() => {
    if (mode === 'success') {
      guidesOpacity.value = withTiming(0, { duration: 200 });
      cornerOpacity.value = withTiming(0, { duration: 300 });
      cornerScale.value = withTiming(0.5, { duration: 300 });

      boxSize.value = withTiming(FRAME_SUCCESS_SIZE, {
        duration: 500,
        easing: EASE_OUT,
      });
      boxRadius.value = withTiming(FRAME_SUCCESS_SIZE / 2, {
        duration: 500,
        easing: EASE_OUT,
      });
      boxBorderWidth.value = withTiming(CORNER_BORDER, {
        duration: 500,
        easing: EASE_OUT,
      });
      boxBgOpacity.value = withTiming(0.25, {
        duration: 500,
        easing: EASE_OUT,
      });
      boxShadowOpacity.value = withTiming(0.75, {
        duration: 500,
        easing: EASE_OUT,
      });

      // Tik çizimi ve pop efekti (350 ms, %70 noktasında 1.08 ölçek)
      checkOpacity.value = withTiming(1, {
        duration: 245,
        easing: EASE_OUT,
      });
      checkScale.value = withSequence(
        withTiming(1.08, {
          duration: 245, // 350 * 0.7
          easing: EASE_OUT,
        }),
        withTiming(1, {
          duration: 105, // 350 * 0.3
          easing: EASE_OUT,
        }),
      );
      tickDashOffset.value = 80;
      tickDashOffset.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.ease),
      });
    } else {
      // Başarı animasyonunu geri sarma (300 ms) ve normal tarama durumuna dönüş
      checkOpacity.value = withTiming(0, { duration: 150 });
      checkScale.value = withTiming(0.6, { duration: 150 });
      tickDashOffset.value = 80;

      boxSize.value = withTiming(FRAME_SCAN_SIZE, {
        duration: 300,
        easing: EASE_OUT,
      });
      boxRadius.value = withTiming(CORNER_RADIUS, {
        duration: 300,
        easing: EASE_OUT,
      });
      boxBorderWidth.value = withTiming(0, {
        duration: 300,
        easing: EASE_OUT,
      });
      boxBgOpacity.value = withTiming(0.04, {
        duration: 300,
        easing: EASE_OUT,
      });
      boxShadowOpacity.value = withTiming(0, {
        duration: 300,
        easing: EASE_OUT,
      });

      cornerOpacity.value = withTiming(1, { duration: 300 });
      cornerScale.value = withTiming(1, { duration: 300 });
      guidesOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [
    boxBgOpacity,
    boxBorderWidth,
    boxRadius,
    boxShadowOpacity,
    boxSize,
    checkOpacity,
    checkScale,
    cornerOpacity,
    cornerScale,
    guidesOpacity,
    mode,
    tickDashOffset,
  ]);

  // Hata durumu: 2 kez ±6 px sallanma (60 ms adımlar) + köşeler 1500 ms kırmızı
  useEffect(() => {
    if (errorCount === 0) return;

    shakeX.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );

    cornerErrorActive.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 1380 }),
      withTiming(0, { duration: 60 }),
    );
  }, [cornerErrorActive, errorCount, shakeX]);

  const frameStyle = useAnimatedStyle(() => ({
    width: boxSize.value,
    height: boxSize.value,
    borderRadius: boxRadius.value,
    borderWidth: boxBorderWidth.value,
    borderColor: colors.vine,
    backgroundColor: `rgba(37, 195, 0, ${boxBgOpacity.value})`,
    shadowColor: colors.vine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: boxShadowOpacity.value,
    shadowRadius: 16,
    transform: [{ translateX: shakeX.value }],
  }));

  const guidesStyle = useAnimatedStyle(() => ({
    opacity: guidesOpacity.value,
  }));

  const beamStyle = useAnimatedStyle(() => ({
    top: beamTop.value,
    opacity: beamOpacity.value * guidesOpacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => {
    const activeColor =
      cornerErrorActive.value > 0.5 ? colors.heart : colors.vine;
    return {
      opacity: cornerOpacity.value,
      borderColor: activeColor,
      shadowColor: activeColor,
      transform: [{ scale: cornerScale.value }],
    };
  });

  const checkContainerStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const animatedTickProps = useAnimatedProps(() => ({
    strokeDashoffset: tickDashOffset.value,
  }));

  return (
    <Animated.View style={[styles.frame, frameStyle]}>
      {/* Sol Üst Köşe */}
      <Animated.View
        style={[styles.cornerBase, styles.cornerTopLeft, cornerStyle]}
      />
      {/* Sağ Üst Köşe */}
      <Animated.View
        style={[styles.cornerBase, styles.cornerTopRight, cornerStyle]}
      />
      {/* Sol Alt Köşe */}
      <Animated.View
        style={[styles.cornerBase, styles.cornerBottomLeft, cornerStyle]}
      />
      {/* Sağ Alt Köşe */}
      <Animated.View
        style={[styles.cornerBase, styles.cornerBottomRight, cornerStyle]}
      />

      {/* Merkez Hedef Artısı */}
      <Animated.View
        pointerEvents="none"
        style={[styles.crosshairWrap, guidesStyle]}
      >
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 5V19M5 12H19"
            stroke={colors.onCamera}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeOpacity={0.35}
          />
        </Svg>
      </Animated.View>

      {/* Yukarı-Aşağı Hareket Eden QR Tarama Işığı */}
      <Animated.View pointerEvents="none" style={[styles.beamWrap, beamStyle]}>
        <Svg width="100%" height={3}>
          <Defs>
            <LinearGradient id="qrBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.vine} stopOpacity={0} />
              <Stop offset="50%" stopColor={colors.vine} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.vine} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 1.25 H204"
            stroke="url(#qrBeamGrad)"
            strokeWidth={2.5}
          />
        </Svg>
      </Animated.View>

      {/* QR Okutulduğunda Ortaya Çıkan Yeşil Tik Animasyonu */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.successCheckWrap, checkContainerStyle]}
      >
        <Svg width={112} height={112} viewBox="0 0 80 80" fill="none">
          <AnimatedPath
            d="M20 42L34 56L61 26"
            stroke={colors.vine}
            strokeWidth={7.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={80}
            animatedProps={animatedTickProps}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cornerBase: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderTopLeftRadius: radius.xl,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderTopRightRadius: radius.xl,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderBottomLeftRadius: radius.xl,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderBottomRightRadius: radius.xl,
  },
  crosshairWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  beamWrap: {
    position: 'absolute',
    left: 16, // tasarım left-4
    right: 16, // tasarım right-4
    height: 2.5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: colors.vine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
  },
  successCheckWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.vine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
});