import { FlatList, View } from "react-native";
import { useGridMetrics } from "@/hooks/useGrid";
import type { AnimeCard, LatestEpisode, ProgressItem } from "@/types";
import { SectionHeader } from "../common/Button";
import { RailSkeleton } from "../common/Skeleton";
import { ContinueCard, EpisodeCard, PosterCard } from "./AnimeCard";

type Variant =
  | { kind: "poster"; items: AnimeCard[] }
  | { kind: "continue"; items: ProgressItem[] }
  | { kind: "episode"; items: LatestEpisode[] };

/** Horizontal, touch-scrollable rail. Virtualised so offscreen cards aren't mounted. */
export function AnimeRail({
  title,
  action,
  onAction,
  loading,
  ...v
}: { title: string; action?: string; onAction?: () => void; loading?: boolean } & Variant) {
  const { railPoster, railWide } = useGridMetrics();
  if (!loading && v.items.length === 0) return null;
  return (
    <View className="mb-7">
      <SectionHeader title={title} action={action} onAction={onAction} />
      {loading ? (
        <RailSkeleton cardWidth={railPoster} />
      ) : (
        <FlatList
          horizontal
          data={v.items as { id: string }[]}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) =>
            v.kind === "poster" ? (
              <PosterCard anime={item as AnimeCard} width={railPoster} />
            ) : v.kind === "continue" ? (
              <ContinueCard item={item as ProgressItem} width={railWide} />
            ) : (
              <EpisodeCard ep={item as LatestEpisode} width={railWide} />
            )
          }
        />
      )}
    </View>
  );
}
