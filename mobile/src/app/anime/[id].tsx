import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimeInfo, Description, GenreChips, Stars } from "@/components/anime/AnimeDetails";
import { AnimeRail } from "@/components/anime/AnimeRail";
import { Art } from "@/components/anime/Art";
import { EpisodeList } from "@/components/anime/EpisodeList";
import { Button } from "@/components/common/Button";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/common/Skeleton";
import { useAnimeDetail, useEpisodes, useRelated } from "@/hooks/queries";
import { useGridMetrics } from "@/hooks/useGrid";
import { pickEpisode, useToggleList, useWatchNow } from "@/hooks/useWatch";
import { metaLine } from "@/lib/format";
import { usePrefs } from "@/store/prefs";
import { useUi } from "@/store/ui";
import { LIST_LABELS } from "@/types";

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-fg mb-3 px-4 text-xl font-bold">{children}</Text>;
}

export default function AnimeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useGridMetrics();
  const detail = useAnimeDetail(id);
  const episodes = useEpisodes(id);
  const related = useRelated(id);
  const viewAnime = usePrefs((s) => s.viewAnime);
  const openSheet = useUi((s) => s.openListSheet);
  const watch = useWatchNow();
  const a = detail.data;
  const { status, toggle } = useToggleList(a ?? ({ id } as never));
  const bannerH = Math.min(Math.round(width * 0.62), 340);

  useEffect(() => {
    if (a) viewAnime(a);
  }, [a?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/55 active:opacity-70"
      style={{ top: insets.top + 6, zIndex: 10 }}
    >
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </Pressable>
  );

  if (detail.isError && !a) {
    return (
      <View className="flex-1 justify-center">
        {back}
        <ErrorState error={detail.error} onRetry={() => detail.refetch()} title="Unable to load this anime" />
      </View>
    );
  }
  if (!a) {
    return (
      <View className="flex-1">
        {back}
        <Skeleton height={bannerH} radius={0} />
        <View className="gap-3 p-4">
          <Skeleton height={28} width="70%" />
          <Skeleton height={14} width="45%" />
          <Skeleton height={90} />
        </View>
      </View>
    );
  }

  const next = episodes.data ? pickEpisode(episodes.data) : null;
  const resuming = next && next.progressSeconds > 5 && !next.completed;
  const watchLabel = resuming ? `Continue Ep ${next.episodeNumber}` : next && next.episodeNumber > 1 ? `Watch Ep ${next.episodeNumber}` : "Watch Now";
  const alt = [a.nativeTitle, ...a.synonyms].filter((t, i, arr) => t && t !== a.title && arr.indexOf(t) === i).slice(0, 2);

  return (
    <View className="flex-1">
      {back}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ height: bannerH }}>
          <Art uri={a.bannerImage ?? a.coverImage} style={{ position: "absolute", inset: 0 }} priority="high" />
          <LinearGradient colors={["rgba(7,5,12,0.5)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }} />
          <LinearGradient colors={["transparent", "#07050c"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bannerH * 0.6 }} />
        </View>

        <View className="-mt-20 flex-row gap-4 px-4">
          <Art uri={a.coverImage} radius={14} style={{ width: 112, height: 168 }} className="border-line border" priority="high" />
          <View className="flex-1 justify-end pb-1">
            <Text className="text-fg text-2xl leading-[30px] font-extrabold">{a.title}</Text>
            {alt.map((t) => (
              <Text key={t} numberOfLines={1} className="text-muted text-[13px]">
                {t}
              </Text>
            ))}
            {a.rating ? (
              <View className="mt-2">
                <Stars rating={a.rating} />
              </View>
            ) : null}
            <Text className="text-muted mt-1.5 text-[13px] font-medium">{metaLine(a)}</Text>
          </View>
        </View>

        <View className="mt-4 gap-4 px-4">
          <GenreChips genres={a.genres} />
          <View className="flex-row gap-3">
            <View className="flex-[3]">
              <Button label={watchLabel} icon="play" onPress={() => watch(a.id)} />
            </View>
            <View className="flex-[2]">
              <Button
                label={status ? LIST_LABELS[status] : "My List"}
                icon={status ? "checkmark" : "add"}
                variant="secondary"
                onPress={() => (status ? openSheet(a) : toggle())}
              />
            </View>
          </View>
          <Description text={a.description} />
        </View>

        <View className="mt-7 px-4">
          <Text className="text-fg mb-1 text-xl font-bold">Information</Text>
          <AnimeInfo anime={a} />
        </View>

        <View className="mt-7">
          <SectionTitle>Episodes</SectionTitle>
          {episodes.isLoading ? (
            <View className="gap-3 px-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={72} />
              ))}
            </View>
          ) : episodes.isError && !episodes.data ? (
            <ErrorState error={episodes.error} onRetry={() => episodes.refetch()} title="Unable to load episodes" />
          ) : (
            <EpisodeList seasons={episodes.data ?? []} animeId={a.id} />
          )}
        </View>

        <View className="mt-8">
          <AnimeRail kind="poster" title="Related Anime" items={related.data ?? []} loading={related.isLoading} />
        </View>
      </ScrollView>
    </View>
  );
}
