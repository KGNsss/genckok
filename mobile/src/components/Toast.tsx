import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha, colors, easing, fonts, motion, radius, size } from '@/theme/theme';

type Kind = 'ok' | 'error';
type ToastApi = { show: (text: string, kind?: Kind) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

const VISIBLE_MS = 2500;

/** Kökte (G1 `_layout.tsx`) bir kez sarılır. Alt sekmelerin 16 px üstünde kapsül gösterir. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; text: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  const show = useCallback(
    (text: string, kind: Kind = 'ok') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), text, kind });
      progress.set(withTiming(1, { duration: motion.tab, easing: Easing.bezier(...easing.out) }));
      timer.current = setTimeout(() => {
        progress.set(withTiming(0, { duration: motion.tab, easing: Easing.in(Easing.ease) }));
        timer.current = setTimeout(() => setToast(null), motion.tab);
      }, VISIBLE_MS);
    },
    [progress],
  );

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  const api = useMemo(() => ({ show }), [show]);
  // sekme çubuğunun (4 + 54 + 16 + güvenli alan) 16 px üstü
  const bottom = insets.bottom + size.tabBarPadTop + size.tabButton + size.tabBarPadBottom + 16;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <View pointerEvents="none" style={[styles.host, { bottom }]}>
          <Animated.View style={[styles.pill, toast.kind === 'error' && styles.pillError, anim]}>
            <Text style={styles.text}>{toast.text}</Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: alpha.forest45,
  },
  pillError: { borderColor: colors.heart },
  // UI şablonu 8.17: Inter 600 13 ink
  text: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 17, color: colors.ink, textAlign: 'center' },
});
