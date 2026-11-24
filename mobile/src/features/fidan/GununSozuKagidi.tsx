import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuoteOfDay } from '@/api/saplings';
import { PaperTitleRow, PulseBox } from '@/components';
import type { ModalViewProps } from '@/modal';
import { colors, space, type } from '@/theme/theme';

const LINE_HEIGHT = 48;
const QUOTE_FONT_SIZE = type.paperLabel.fontSize ?? 19;
const BASELINE_TOP_OFFSET = Math.max(4, 43 - QUOTE_FONT_SIZE);

export default function GununSozuKagidi(_props: ModalViewProps<'gunun-sozu'>) {
  const { data: quote, isLoading } = useQuoteOfDay();

  return (
    <View style={styles.root}>
      <PaperTitleRow text="GÜNÜN SÖZÜ" />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <PulseBox width="88%" height={22} radius={6} />
          <View style={styles.loadingSpacer} />
          <PulseBox width="64%" height={22} radius={6} />
        </View>
      ) : quote && quote.text.trim().length > 0 ? (
        <View style={styles.contentWrap}>
          <Text
            style={[
              type.paperLabel,
              styles.lineAlignedText,
            ]}
          >
            {`“${quote.text.trim()}”`}
          </Text>

          {quote.author ? (
            <Text
              style={[
                type.paperLabel,
                styles.lineAlignedText,
                styles.authorText,
              ]}
            >
              {`— ${quote.author.trim()}`}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.contentWrap}>
          <Text
            style={[
              type.paperLabel,
              styles.lineAlignedText,
            ]}
          >
            Bugün için söz yok. Yarın yine bak.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingWrap: {
    paddingLeft: 48,
    paddingRight: 20,
    paddingTop: BASELINE_TOP_OFFSET + 8,
  },
  loadingSpacer: {
    height: LINE_HEIGHT - 22,
  },
  contentWrap: {
    paddingLeft: 48,
    paddingRight: 20,
  },
  lineAlignedText: {
    lineHeight: LINE_HEIGHT,
    paddingTop: BASELINE_TOP_OFFSET,
    color: colors.ink,
  },
  authorText: {
    textAlign: 'right',
    color: colors.inkMuted,
    marginTop: space[1] / 4,
  },
});