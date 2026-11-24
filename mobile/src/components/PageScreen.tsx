import { useCallback, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, easing, motion, size } from '@/theme/theme';
import { PostItTitle } from './PostItTitle';

type PageScreenProps = {
  title: string;
  /**
   * İçeriğin üstten başlangıcı (`pageTop.*`).
   * Varsayılan: `scroll` ise 84 (post-it başlığın altı); `scroll={false}` ise 0 (içerik, örn. FlatList, kendi üst boşluğunu verir).
   */
  contentTop?: number;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sayfa 1: içerik dikeyde ortalı. */
  centerContent?: boolean;
  children: ReactNode;
};

const DEFAULT_TOP = 84;

/** Her sekmenin iskeleti: nane zemin, yatay boşluk 16, post-it başlık, odaklanınca giriş animasyonu (200 ms). */
export function PageScreen({ title, contentTop, scroll = true, refreshing, onRefresh, centerContent, children }: PageScreenProps) {
  const p = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      p.set(0);
      p.set(withTiming(1, { duration: motion.pageEnter, easing: Easing.bezier(...easing.out) }));
    }, [p]),
  );
  const enter = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 4 }] }));

  const top = contentTop ?? (scroll ? DEFAULT_TOP : 0);
  const inner = [styles.inner, { paddingTop: top }, centerContent && styles.center];

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.fill, enter]}>
        {scroll ? (
          <ScrollView
            style={styles.fill}
            contentContainerStyle={[styles.scrollContent, { paddingTop: top }, centerContent && styles.center]}
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} /> : undefined}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={inner}>{children}</View>
        )}
      </Animated.View>
      <PostItTitle text={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: size.screenPadX },
  scrollContent: { flexGrow: 1, paddingHorizontal: size.screenPadX, paddingBottom: 24 },
  center: { justifyContent: 'center', alignItems: 'center' },
});
