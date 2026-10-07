import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Text, View } from "react-native";
import { useListStatusMap } from "@/hooks/queries";
import { fmtTime, pct } from "@/lib/format";
import { useUi } from "@/store/ui";
import type { AnimeCard as Anime, LatestEpisode, ProgressItem } from "@/types";
import { ProgressBar } from "../common/Button";
import { Art } from "./Art";
import { PressableScale } from "./PressableScale";

function useOpenAnime() {
  const router = useRouter();
  return (id: string) => router.push(`/anime/${id}`);
}

function useLongPressList() {
  const open = useUi((s) => s.openListSheet);
  return (a: Anime) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    open(a);
  };
}

/** Portrait poster: poster + title. Long press opens the My List status sheet. */
export const PosterCard = memo(function PosterCard({ anime, width }: { anime: Anime; width: number }) {
  const open = useOpenAnime();
  const longPress = useLongPressList();
  const inList = useListStatusMap().has(anime.id);
  return (
    <View style={{ width }}>
      <PressableScale onPress={() => open(anime.id)} onLongPress={() => longPress(anime)} label={anime.title}>
        <View>
          <Art uri={anime.coverImage} radius={14} style={{ width, height: width * 1.5 }} />
          {anime.rating ? (
            <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-black/65 px-2 py-0.5">
              <Ionicons name="star" size={10} color="#fbbf24" />
              <Text className="text-xs font-semibold text-white">{anime.rating.toFixed(1)}</Text>
            </View>
          ) : anime.status === "UPCOMING" ? (
            <View className="bg-accent absolute bottom-2 left-2 rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-black">SOON</Text>
            </View>
          ) : null}
          {inList ? (
            <View className="bg-primary absolute top-2 right-2 h-6 w-6 items-center justify-center rounded-full">
              <Ionicons name="bookmark" size={12} color="#fff" />
            </View>
          ) : null}
        </View>
        <Text numberOfLines={2} className="text-fg mt-2 text-[13px] leading-[17px] font-semibold">
          {anime.title}
        </Text>
      </PressableScale>
    </View>
  );
});

/** Landscape card for Continue Watching: episode art, progress and a continue affordance. */
export const ContinueCard = memo(function ContinueCard({ item, width }: { item: ProgressItem; width: number }) {
  const router = useRouter();
  const longPress = useLongPressList();
  const p = pct(item.progressSeconds, item.durationSeconds);
  return (
    <View style={{ width }}>
      <PressableScale
        onPress={() => router.push(`/player/${item.animeId}/${item.episodeId}`)}
        onLongPress={() => longPress(item.anime)}
        label={`Continue ${item.anime.title} episode ${item.episode.episodeNumber}`}
      >
        <View>
          <Art uri={item.episode.thumbnail ?? item.anime.bannerImage} radius={14} style={{ width, height: width * 0.56 }} />
          <View className="absolute inset-0 items-center justify-center">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-black/55">
              <Ionicons name="play" size={22} color="#fff" />
            </View>
          </View>
          <View className="absolute right-2.5 bottom-2 left-2.5">
            <ProgressBar value={p} />
          </View>
        </View>
        <Text numberOfLines={1} className="text-fg mt-2 text-sm font-bold">
          {item.anime.title}
        </Text>
        <Text numberOfLines={1} className="text-muted text-xs">
          Episode {item.episode.episodeNumber} • {fmtTime(item.progressSeconds)} / {fmtTime(item.durationSeconds)}
        </Text>
      </PressableScale>
    </View>
  );
});

/** Landscape episode card used in "Latest Episodes". */
export const EpisodeCard = memo(function EpisodeCard({ ep, width }: { ep: LatestEpisode; width: number }) {
  const open = useOpenAnime();
  return (
    <View style={{ width }}>
      <PressableScale onPress={() => open(ep.animeId)} label={`${ep.anime.title} episode ${ep.episodeNumber}`}>
        <Art uri={ep.thumbnail ?? ep.anime.bannerImage} radius={14} style={{ width, height: width * 0.56 }} />
        <View className="bg-primary absolute top-2 left-2 rounded-full px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">EP {ep.episodeNumber}</Text>
        </View>
        <Text numberOfLines={1} className="text-fg mt-2 text-sm font-bold">
          {ep.anime.title}
        </Text>
        <Text numberOfLines={1} className="text-muted text-xs">
          {ep.title.replace(/^Episode \d+: /, "")}
        </Text>
      </PressableScale>
    </View>
  );
});
