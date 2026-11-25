import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { MySapling } from '@/api/types';
import { CircleButton, SaplingCard } from '@/components';
import { useModal } from '@/modal';
import { motion, pressed, radius } from '@/theme/theme';

export interface FidanDestesiProps {
  saplings: MySapling[];
  focusId?: string;
}

interface CardSlotSpec {
  tx: number;
  ty: number;
  scale: number;
  opacity: number;
  brightness: number;
  zIndex: number;
  interactive: boolean;
}

const CAROUSEL_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const CARD_W = 184;
const CARD_H = 276;

function getSlotSpec(diff: number): CardSlotSpec {
  if (diff === 0) {
    return {
      tx: 0,
      ty: 0,
      scale: 1,
      opacity: 1,
      brightness: 1,
      zIndex: 20,
      interactive: true,
    };
  }
  if (diff === -1) {
    return {
      tx: -120,
      ty: -36,
      scale: 0.66,
      opacity: 0.92,
      brightness: 0.95,
      zIndex: 10,
      interactive: true,
    };
  }
  if (diff === 1) {
    return {
      tx: 120,
      ty: -36,
      scale: 0.66,
      opacity: 0.92,
      brightness: 0.95,
      zIndex: 10,
      interactive: true,
    };
  }
  if (diff <= -2) {
    return {
      tx: -156,
      ty: -46,
      scale: 0.5,
      opacity: 0,
      brightness: 0.9,
      zIndex: 0,
      interactive: false,
    };
  }
  return {
    tx: 156,
    ty: -46,
    scale: 0.5,
    opacity: 0,
    brightness: 0.9,
    zIndex: 0,
    interactive: false,
  };
}

interface DestKartProps {
  sapling: MySapling;
  index: number;
  activeIndex: number;
  totalCount: number;
  dragX: SharedValue<number>;
  isDraggingShared: SharedValue<boolean>;
  onSelectCenter: (treeId: string) => void;
  onFocusSide: (index: number) => void;
}

function DestKart({
  sapling,
  index,
  activeIndex,
  totalCount,
  dragX,
  isDraggingShared,
  onSelectCenter,
  onFocusSide,
}: DestKartProps) {
  const diff = index - activeIndex;
  const spec = getSlotSpec(diff);

  const txShared = useSharedValue(spec.tx);
  const tyShared = useSharedValue(spec.ty);
  const scaleShared = useSharedValue(spec.scale);
  const opacityShared = useSharedValue(spec.opacity);
  const brightnessShared = useSharedValue(spec.brightness);

  useEffect(() => {
    txShared.value = withTiming(spec.tx, {
      duration: motion.carousel,
      easing: CAROUSEL_EASING,
    });
    tyShared.value = withTiming(spec.ty, {
      duration: motion.carousel,
      easing: CAROUSEL_EASING,
    });
    scaleShared.value = withTiming(spec.scale, {
      duration: motion.carousel,
      easing: CAROUSEL_EASING,
    });
    opacityShared.value = withTiming(spec.opacity, {
      duration: 320,
      easing: CAROUSEL_EASING,
    });
    brightnessShared.value = withTiming(spec.brightness, {
      duration: 320,
      easing: CAROUSEL_EASING,
    });
  }, [
    spec.tx,
    spec.ty,
    spec.scale,
    spec.opacity,
    spec.brightness,
    txShared,
    tyShared,
    scaleShared,
    opacityShared,
    brightnessShared,
  ]);

  const animatedCardStyle = useAnimatedStyle(() => {
    let extraX = 0;
    let extraY = 0;
    let extraScale = 0;

    if (isDraggingShared.value) {
      const dx = dragX.value;
      const canGoLeft = activeIndex > 0;
      const canGoRight = activeIndex < totalCount - 1;

      if (dx > 0 && canGoLeft) {
        const p = Math.min(1, dx / 150);
        if (diff === 0) {
          extraX = 44 * p;
          extraY = -12 * p;
          extraScale = -0.12 * p;
        } else if (diff === -1) {
          extraX = 44 * p;
          extraY = 12 * p;
          extraScale = 0.12 * p;
        }
      } else if (dx < 0 && canGoRight) {
        const p = Math.min(1, Math.abs(dx) / 150);
        if (diff === 0) {
          extraX = -44 * p;
          extraY = -12 * p;
          extraScale = -0.12 * p;
        } else if (diff === 1) {
          extraX = -44 * p;
          extraY = 12 * p;
          extraScale = 0.12 * p;
        }
      } else if (diff === 0) {
        extraX = dx * 0.14;
      }
    }

    return {
      opacity: opacityShared.value,
      transform: [
        { translateX: txShared.value + extraX },
        { translateY: tyShared.value + extraY },
        { scale: scaleShared.value + extraScale },
      ],
    };
  });

  const darkenOverlayStyle = useAnimatedStyle(() => {
    const dimAmount = Math.max(0, Math.min(1, 1 - brightnessShared.value));
    return {
      backgroundColor: `rgba(0,0,0,${dimAmount.toFixed(3)})`,
    };
  });

  const handlePress = () => {
    if (isDraggingShared.value) return;
    if (diff === 0) {
      onSelectCenter(sapling.id);
    } else if (spec.interactive) {
      onFocusSide(index);
    }
  };

  return (
    <Animated.View
      pointerEvents={spec.interactive ? 'auto' : 'none'}
      style={[
        styles.cardWrapper,
        { zIndex: spec.zIndex },
        animatedCardStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={!spec.interactive}
        style={({ pressed: isPressed }) => ({
          transform: [{ scale: isPressed ? pressed.scale : 1 }],
        })}
      >
        <View style={styles.cardVisualAnchor}>
          <SaplingCard
            label={sapling.label}
            coverPath={sapling.cover_path}
            size="lg"
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.brightnessOverlay, darkenOverlayStyle]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function FidanDestesi({ saplings, focusId }: FidanDestesiProps) {
  const modal = useModal();
  const total = saplings.length;

  const getInitialIndex = () => {
    if (total === 0) return 0;
    if (focusId) {
      const found = saplings.findIndex((s) => s.id === focusId);
      if (found !== -1) return found;
    }
    return total - 1;
  };

  const [activeIndex, setActiveIndex] = useState<number>(getInitialIndex);
  const totalShared = useSharedValue(total);
  const dragX = useSharedValue(0);
  const isDraggingShared = useSharedValue(false);

  useEffect(() => {
    totalShared.value = total;
  }, [total, totalShared]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (total === 0) {
        setActiveIndex(0);
        return;
      }
      if (focusId) {
        const idx = saplings.findIndex((s) => s.id === focusId);
        if (idx !== -1) {
          setActiveIndex(idx);
          return;
        }
      }
      setActiveIndex((prev) => (prev >= total ? total - 1 : prev));
    }, 0);

    return () => clearTimeout(timer);
  }, [focusId, saplings, total]);

  const notifyIndexChange = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    void Haptics.selectionAsync();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      'worklet';
      isDraggingShared.value = true;
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      'worklet';
      const maxIndex = totalShared.value - 1;
      let nextIndex = activeIndex;
      if (e.translationX > 32 && activeIndex > 0) {
        nextIndex = activeIndex - 1;
      } else if (e.translationX < -32 && activeIndex < maxIndex) {
        nextIndex = activeIndex + 1;
      }
      dragX.value = 0;
      isDraggingShared.value = false;
      if (nextIndex !== activeIndex) {
        runOnJS(notifyIndexChange)(nextIndex);
      }
    })
    .onFinalize(() => {
      'worklet';
      dragX.value = 0;
      isDraggingShared.value = false;
    });

  const handleSelectCenter = (treeId: string) => {
    void Haptics.selectionAsync();
    modal.open({ name: 'fidan-detay', treeId });
  };

  const handleFocusSide = (targetIndex: number) => {
    if (targetIndex === activeIndex) return;
    setActiveIndex(targetIndex);
    void Haptics.selectionAsync();
  };

  const handleOpenAddModal = () => {
    void Haptics.selectionAsync();
    modal.open({ name: 'fidan-ekle' });
  };

  const showLeftPlus = total > 0 && activeIndex === 0;
  const showRightPlus = total > 0 && activeIndex === total - 1;

  const leftPlusAnimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showLeftPlus ? 1 : 0, {
      duration: 260,
      easing: CAROUSEL_EASING,
    }),
    transform: [
      { translateX: -152 },
      { translateY: -48 },
      {
        scale: withTiming(showLeftPlus ? 1 : 0.75, {
          duration: 320,
          easing: CAROUSEL_EASING,
        }),
      },
    ],
  }));

  const rightPlusAnimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showRightPlus ? 1 : 0, {
      duration: 260,
      easing: CAROUSEL_EASING,
    }),
    transform: [
      { translateX: 134 },
      { translateY: -48 },
      {
        scale: withTiming(showRightPlus ? 1 : 0.75, {
          duration: 320,
          easing: CAROUSEL_EASING,
        }),
      },
    ],
  }));

  if (total === 0) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <View style={styles.stage}>
          {saplings.map((sapling, index) => (
            <DestKart
              key={sapling.id}
              sapling={sapling}
              index={index}
              activeIndex={activeIndex}
              totalCount={total}
              dragX={dragX}
              isDraggingShared={isDraggingShared}
              onSelectCenter={handleSelectCenter}
              onFocusSide={handleFocusSide}
            />
          ))}

          <Animated.View
            pointerEvents={showLeftPlus ? 'auto' : 'none'}
            style={[styles.plusAnchor, leftPlusAnimStyle]}
          >
            <CircleButton
              icon="plus"
              size={50}
              onPress={handleOpenAddModal}
              accessibilityLabel="Çizgili Kağıdı Aç"
            />
          </Animated.View>

          <Animated.View
            pointerEvents={showRightPlus ? 'auto' : 'none'}
            style={[styles.plusAnchor, rightPlusAnimStyle]}
          >
            <CircleButton
              icon="plus"
              size={50}
              onPress={handleOpenAddModal}
              accessibilityLabel="Çizgili Kağıdı Aç"
            />
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 385,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVisualAnchor: {
    position: 'relative',
  },
  brightnessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.cardLg,
  },
  plusAnchor: {
    position: 'absolute',
    zIndex: 30,
  },
});