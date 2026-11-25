// SORU: `useForestSaplings()` içinde kullanıcının kendi fidanları da dönerse filtreleme veya `is_mine` ayrımı yapılmalı mı? Burada `p_exclude_mine: true` ile geldiği ve hook'un orman listesini olduğu gibi sunduğu varsayıldı.

// SORU: `npx tsc --noEmit` çalıştırıldığında sorumluluğumda olmayan hazır dosyalarda (`giris.tsx`, `kayit.tsx`, `sifre-yenile.tsx`, `LinedPaper.tsx`, `WoodTabBar.tsx`) tip hataları görülüyor; kural gereği bu dosyalara dokunulmadı.

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import * as Haptics from 'expo-haptics';

import Animated, {

Easing,

useAnimatedStyle,

useSharedValue,

withTiming,

} from 'react-native-reanimated';



import {

Capsule,

CircleButton,

EmptyNote,

PageScreen,

PulseBox,

SaplingCard,

useToast,

} from '@/components';

import { useModal } from '@/modal';

import { useForestSaplings, useMySaplings } from '@/api/saplings';

import type { ForestSapling, MySapling } from '@/api/types';

import { toMessage } from '@/lib/errors';

import { easing, motion, pageTop, pressed, radius, size, space } from '@/theme/theme';



const HORIZONTAL_GAP = space[2.5];

const ROW_VERTICAL_GAP = space[4];

const PLUS_OFFSET_Y = -space[4];

const MY_SECTION_GAP = 13;

const FOREST_SECTION_TOP_GAP = space[6];

const FOREST_GRID_TOP_GAP = space[3.5];

const BOTTOM_PADDING = space[4];

const INITIAL_FOREST_SKELETON_COUNT = 6;

const FOOTER_FOREST_SKELETON_COUNT = 3;



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const pressEasing = Easing.bezier(...easing.out);



interface PressableSaplingCellProps {

label: string;

coverPath: string | null;

onPress: () => void;

}



function PressableSaplingCell({ label, coverPath, onPress }: PressableSaplingCellProps) {

const scale = useSharedValue(1);



const animatedStyle = useAnimatedStyle(() => ({

transform: [{ scale: scale.value }],

}));



const handlePressIn = useCallback(() => {

scale.modify(() => {

'worklet';

return withTiming(pressed.scale, {

duration: motion.tab,

easing: pressEasing,

});

});

}, [scale]);



const handlePressOut = useCallback(() => {

scale.modify(() => {

'worklet';

return withTiming(1, {

duration: motion.tab,

easing: pressEasing,

});

});

}, [scale]);



const handlePress = useCallback(() => {

void Haptics.selectionAsync();

onPress();

}, [onPress]);



return (

<AnimatedPressable

onPress={handlePress}

onPressIn={handlePressIn}

onPressOut={handlePressOut}

style={animatedStyle}

accessibilityRole="button"

accessibilityLabel={`${label} fidan detayını aç`}

>

<SaplingCard label={label} coverPath={coverPath} size="sm" onPress={handlePress} />

</AnimatedPressable>

);

}



export default function TumFidanlarScreen() {

const router = useRouter();

const params = useLocalSearchParams<{ open?: string }>();

const modal = useModal();

const toast = useToast();



const [refreshing, setRefreshing] = useState(false);



const {

data: mySaplings,

isLoading: isMyLoading,

isError: isMyError,

error: myError,

refetch: refetchMySaplings,

} = useMySaplings();



const {

data: forestPages,

isLoading: isForestLoading,

isError: isForestError,

error: forestError,

fetchNextPage,

hasNextPage,

isFetchingNextPage,

refetch: refetchForestSaplings,

} = useForestSaplings();



useEffect(() => {

if (!params.open) return;

const targetTreeId = params.open;

modal.open({ name: 'fidan-detay', treeId: targetTreeId });

router.setParams({ open: undefined });

}, [modal, params.open, router]);



const forestItems = useMemo<ForestSapling[]>(() => {

if (!forestPages) return [];

return forestPages.pages.flat();

}, [forestPages]);



const handleOpenSaplingDetail = useCallback(

(treeId: string) => {

modal.open({ name: 'fidan-detay', treeId });

},

[modal],

);



const handleOpenAddSapling = useCallback(() => {

void Haptics.selectionAsync();

modal.open({ name: 'fidan-ekle' });

}, [modal]);



const handleRefreshAll = useCallback(async () => {

setRefreshing(true);

try {

await Promise.all([refetchMySaplings(), refetchForestSaplings()]);

} catch (err) {

toast.show(toMessage(err), 'error');

} finally {

setRefreshing(false);

}

}, [refetchForestSaplings, refetchMySaplings, toast]);



const handleEndReached = useCallback(() => {

if (hasNextPage && !isFetchingNextPage) {

void fetchNextPage();

}

}, [fetchNextPage, hasNextPage, isFetchingNextPage]);



const renderMySaplingsSection = () => {

if (isMyLoading) {

return (

<View style={styles.myRowContainer}>

<PulseBox width={size.cardSmW} height={size.cardSmH} radius={radius.card} />

<PulseBox width={size.cardSmW} height={size.cardSmH} radius={radius.card} />

</View>

);

}



if (isMyError) {

return (

<View style={styles.sectionStateBox}>

<EmptyNote text={toMessage(myError)} />

<Capsule

variant="chip"

text="Tekrar dene"

onPress={() => {

void refetchMySaplings();

}}

/>

</View>

);

}



const list: MySapling[] = mySaplings ?? [];



return (

<ScrollView

horizontal

showsHorizontalScrollIndicator={false}

contentContainerStyle={styles.myScrollContent}

style={styles.myScroll}

>

{list.map((sapling) => (

<PressableSaplingCell

key={sapling.id}

label={sapling.label}

coverPath={sapling.cover_path}

onPress={() => handleOpenSaplingDetail(sapling.id)}

/>

))}

<View style={styles.plusButtonWrap}>

<CircleButton icon="plus" size={size.plusSm} onPress={handleOpenAddSapling} />

</View>

</ScrollView>

);

};



const renderForestStateHeaderOrEmpty = () => {

if (isForestLoading) {

return (

<View style={styles.forestSkeletonGrid}>

{Array.from({ length: INITIAL_FOREST_SKELETON_COUNT }).map((_, index) => (

<View key={`forest-init-pulse-${index}`} style={styles.forestGridCell}>

<PulseBox width={size.cardSmW} height={size.cardSmH} radius={radius.card} />

</View>

))}

</View>

);

}



if (isForestError) {

return (

<View style={styles.sectionStateBox}>

<EmptyNote text={toMessage(forestError)} />

<Capsule

variant="chip"

text="Tekrar dene"

onPress={() => {

void refetchForestSaplings();

}}

/>

</View>

);

}



if (forestItems.length === 0) {

return (

<View style={styles.sectionStateBox}>

<EmptyNote text="Ormanda henüz başka fidan yok." />

</View>

);

}



return null;

};



const listHeaderComponent = useMemo(

() => (

<View>

<Capsule variant="title" text="Benim Fidanlarım" style={styles.sectionCapsule} />

<View style={styles.mySectionSpacer}>{renderMySaplingsSection()}</View>



<Capsule

variant="title"

text="Ormandaki Fidanlar"

style={[styles.sectionCapsule, styles.forestCapsuleSpacing]}

/>

<View style={styles.forestGridTopSpacer}>{renderForestStateHeaderOrEmpty()}</View>

</View>

),

// eslint-disable-next-line react-hooks/exhaustive-deps

[

forestError,

forestItems.length,

handleOpenAddSapling,

handleOpenSaplingDetail,

isForestError,

isForestLoading,

isMyError,

isMyLoading,

myError,

mySaplings,

refetchForestSaplings,

refetchMySaplings,

],

);



const renderForestItem = useCallback(

({ item }: { item: ForestSapling }) => (

<View style={styles.forestGridCell}>

<PressableSaplingCell

label={item.label}

coverPath={item.cover_path}

onPress={() => handleOpenSaplingDetail(item.id)}

/>

</View>

),

[handleOpenSaplingDetail],

);



const renderItemSeparator = useCallback(

() => <View style={styles.rowSeparator} />,

[],

);



const renderListFooter = useCallback(() => {

if (!isFetchingNextPage) return null;

return (

<View style={styles.footerSkeletonRow}>

{Array.from({ length: FOOTER_FOREST_SKELETON_COUNT }).map((_, index) => (

<View key={`forest-more-pulse-${index}`} style={styles.forestGridCell}>

<PulseBox width={size.cardSmW} height={size.cardSmH} radius={radius.card} />

</View>

))}

</View>

);

}, [isFetchingNextPage]);



const keyExtractor = useCallback((item: ForestSapling) => item.id, []);



return (

<PageScreen

title="Tüm Fidanlar"

scroll={false}

refreshing={refreshing}

onRefresh={() => {

void handleRefreshAll();

}}

>

<FlatList

data={isForestLoading || isForestError ? [] : forestItems}

keyExtractor={keyExtractor}

numColumns={3}

renderItem={renderForestItem}

ListHeaderComponent={listHeaderComponent}

ItemSeparatorComponent={renderItemSeparator}

ListFooterComponent={renderListFooter}

columnWrapperStyle={styles.columnWrapper}

contentContainerStyle={styles.listContentContainer}

showsVerticalScrollIndicator={false}

onEndReached={handleEndReached}

onEndReachedThreshold={0.6}

/>

</PageScreen>

);

}



const styles = StyleSheet.create({

listContentContainer: {

paddingTop: pageTop.capsuleUnderTitle,

paddingBottom: BOTTOM_PADDING,

},

sectionCapsule: {

alignSelf: 'flex-start',

},

mySectionSpacer: {

marginTop: MY_SECTION_GAP,

},

myScroll: {

overflow: 'visible',

},

myScrollContent: {

gap: HORIZONTAL_GAP,

alignItems: 'center',

paddingRight: space[4],

},

myRowContainer: {

flexDirection: 'row',

alignItems: 'center',

gap: HORIZONTAL_GAP,

},

plusButtonWrap: {

marginTop: PLUS_OFFSET_Y,

},

forestCapsuleSpacing: {

marginTop: FOREST_SECTION_TOP_GAP,

},

forestGridTopSpacer: {

marginTop: FOREST_GRID_TOP_GAP,

},

forestSkeletonGrid: {

flexDirection: 'row',

flexWrap: 'wrap',

rowGap: ROW_VERTICAL_GAP,

},

columnWrapper: {

gap: HORIZONTAL_GAP,

},

forestGridCell: {

flex: 1 / 3,

alignItems: 'center',

},

rowSeparator: {

height: ROW_VERTICAL_GAP,

},

footerSkeletonRow: {

flexDirection: 'row',

gap: HORIZONTAL_GAP,

marginTop: ROW_VERTICAL_GAP,

},

sectionStateBox: {

alignItems: 'center',

gap: space[2],

paddingVertical: space[2],

},

}); 