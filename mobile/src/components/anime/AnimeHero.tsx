import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useGridMetrics } from "@/hooks/useGrid";
import { useToggleList, useWatchNow } from "@/hooks/useWatch";
import { metaLine } from "@/lib/format";
import type { AnimeCard } from "@/types";
import { Button } from "../common/Button";
import { Skeleton } from "../common/Skeleton";
import { Art } from "./Art";

const ROTATE_MS = 6500;

function Slide({ anime, width, height }: { anime: AnimeCard; width: number; height: number }) {
  const router = useRouter();
  const watch = useWatchNow();
  const { status, toggle } = useToggleList(anime);
  return (
    <View style={{ width, height }}>
      {/* Tap target is a sibling layer so the action buttons aren't nested inside another button. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${anime.title} details`}
        onPress={() => router.push(`/anime/${anime.id}`)}
        style={{ position: "absolute", inset: 0 }}
      >
        <Art uri={anime.bannerImage ?? anime.coverImage} style={{ position: "absolute", inset: 0 }} priority="high" />
        <LinearGradient colors={["rgba(10,6,18,0.55)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140 }} />
        <LinearGradient
          colors={["transparent", "rgba(10,6,18,0.85)", "#0a0612"]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.78 }}
        />
      </Pressable>
      <View pointerEvents="box-none" className="absolute right-0 bottom-0 left-0 px-4 pb-9" style={{ maxWidth: 720 }}>
        <Text numberOfLines={2} className="text-3xl leading-9 font-extrabold text-white">
          {anime.title}
        </Text>
        <Text className="mt-1.5 text-[13px] font-medium text-white/80">
          {metaLine(anime)}
          {anime.rating ? `  •  ★ ${anime.rating.toFixed(1)}` : ""}
        </Text>
        <Text numberOfLines={2} className="mt-2 text-[13px] leading-[18px] text-white/70">
          {anime.description}
        </Text>
        <View className="mt-4 flex-row gap-3">
          <Button label="Watch Now" icon="play" onPress={() => watch(anime.id)} />
          <Button label={status ? "In My List" : "My List"} icon={status ? "checkmark" : "add"} variant="secondary" onPress={toggle} />
        </View>
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 6, { duration: 220 }),
    opacity: withTiming(active ? 1 : 0.4, { duration: 220 }),
  }));
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: "#fff" }, style]} />;
}

/** Swipeable, auto-rotating hero. Height is capped so it never fills small screens. */
export function AnimeHero({ items, loading }: { items: AnimeCard[]; loading?: boolean }) {
  const { width } = useGridMetrics();
  const height = Math.round(Math.min(Math.max(width * 1.12, 380), 520));
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<AnimeCard>>(null);
  const dragging = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      list.current?.scrollToOffset({ offset: i * width, animated: true });
      setIndex(i);
    },
    [width],
  );

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      if (!dragging.current) goTo((index + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [index, items.length, goTo]);

  if (loading || items.length === 0) return <Skeleton height={height} radius={0} />;

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height }}>
      <FlatList
        ref={list}
        data={items}
        horizontal
        pagingEnabled
        keyExtractor={(a) => a.id}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => (dragging.current = true)}
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={(e) => {
          // Web and some Android builds skip momentum events on short drags.
          if (e.nativeEvent.velocity?.x === 0) onEnd(e);
        }}
        renderItem={({ item }) => <Slide anime={item} width={width} height={height} />}
      />
      <View pointerEvents="none" className="absolute right-0 bottom-3 left-0 flex-row items-center justify-center gap-1.5">
        {items.map((a, i) => (
          <Dot key={a.id} active={i === index} />
        ))}
      </View>
    </View>
  );
}
