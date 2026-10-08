import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnimeHero } from "@/components/anime/AnimeHero";
import { AnimeRail } from "@/components/anime/AnimeRail";
import { Chip, SectionHeader } from "@/components/common/Button";
import { ErrorState, OfflineBanner } from "@/components/common/States";
import { useHome } from "@/hooks/queries";
import { useAuth } from "@/store/auth";

export default function Home() {
  const { data, isLoading, isError, error, refetch } = useHome();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const username = useAuth((s) => s.username);
  const [refreshing, setRefreshing] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["home"] });
    setRefreshing(false);
  };

  // No cache and the request failed (first launch while offline / API down)
  if (isError && !data) {
    return (
      <View className="flex-1 justify-center" style={{ paddingTop: insets.top }}>
        <OfflineBanner />
        <ErrorState error={error} onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={64}
        onScroll={(e) => {
          const past = e.nativeEvent.contentOffset.y > 160;
          if (past !== pastHero) setPastHero(past);
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#e11d48" progressViewOffset={insets.top} />}
      >
        <AnimeHero items={data?.hero ?? []} loading={isLoading} />
        <View className="-mt-1 pt-4">
          <OfflineBanner />
          <AnimeRail kind="continue" title="Continue Watching" items={data?.continueWatching ?? []} loading={isLoading && false} />
          <AnimeRail kind="poster" title="Recently Added" items={data?.recentlyAdded ?? []} loading={isLoading} />
          <AnimeRail kind="episode" title="Latest Episodes" items={data?.latestEpisodes ?? []} loading={isLoading} />
          <AnimeRail kind="poster" title="Trending" items={data?.trending ?? []} loading={isLoading} />
          <AnimeRail kind="poster" title="Popular This Season" items={data?.popularSeason ?? []} />
          <AnimeRail kind="poster" title="Currently Airing" items={data?.airing ?? []} />
          <AnimeRail kind="poster" title="New Anime" items={data?.newAnime ?? []} action="See all" onAction={() => router.push("/new-anime")} />
          <AnimeRail kind="poster" title="Recommended For You" items={data?.recommended ?? []} />
          {data?.genres?.length ? (
            <View className="mb-7">
              <SectionHeader title="Genres" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {data.genres.map((g) => (
                  <Chip key={g.id} label={g.name} onPress={() => router.push({ pathname: "/browse", params: { genre: g.name } })} />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <AnimeRail kind="poster" title="Recently Updated" items={data?.recentlyUpdated ?? []} />
        </View>
      </ScrollView>

      {/* Floating header over the hero */}
      <View
        pointerEvents={pastHero ? "none" : "box-none"}
        className="absolute right-0 left-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 6, opacity: pastHero ? 0 : 1 }}
      >
        <Link href="/profile" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Profile" className="h-10 w-10 items-center justify-center rounded-full bg-black/45 active:opacity-70">
            <Text className="text-base font-bold text-white">{username.slice(0, 1).toUpperCase()}</Text>
          </Pressable>
        </Link>
        <Link href="/search" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" className="h-10 w-10 items-center justify-center rounded-full bg-black/45 active:opacity-70">
            <Ionicons name="search" size={20} color="#fff" />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
