import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { pct } from "@/lib/format";
import type { Episode, SeasonEpisodes } from "@/types";
import { Chip, ProgressBar } from "../common/Button";
import { EmptyState } from "../common/States";
import { Art } from "./Art";
import { PressableScale } from "./PressableScale";

function EpisodeRow({ ep, animeId }: { ep: Episode; animeId: string }) {
  const router = useRouter();
  const p = pct(ep.progressSeconds, ep.durationSeconds);
  const future = ep.releaseDate ? new Date(ep.releaseDate) > new Date() : false;
  const label = ep.title.replace(/^Episode \d+: /, "");
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => (future ? undefined : router.push(`/player/${animeId}/${ep.id}`))}
      label={`Episode ${ep.episodeNumber} ${label}${ep.completed ? ", watched" : ""}`}
      style={{ opacity: future ? 0.5 : ep.completed ? 0.65 : 1 }}
    >
      <View className="flex-row items-center gap-3 px-4 py-2">
        <View>
          <Art uri={ep.thumbnail} radius={10} style={{ width: 128, height: 72 }} />
          {ep.completed ? (
            <View className="bg-success absolute top-1.5 right-1.5 h-5 w-5 items-center justify-center rounded-full">
              <Ionicons name="checkmark" size={13} color="#07050c" />
            </View>
          ) : (
            <View className="absolute inset-0 items-center justify-center">
              <Ionicons name={future ? "time" : "play-circle"} size={28} color="rgba(255,255,255,0.85)" />
            </View>
          )}
          {p > 0 && !ep.completed ? (
            <View className="absolute right-1.5 bottom-1.5 left-1.5">
              <ProgressBar value={p} height={3} />
            </View>
          ) : null}
        </View>
        <View className="flex-1">
          <Text className="text-fg text-sm font-bold">Episode {String(ep.episodeNumber).padStart(2, "0")}</Text>
          <Text numberOfLines={1} className="text-muted text-[13px]">
            {label}
          </Text>
          <Text className="text-muted mt-0.5 text-xs">
            {future
              ? `Airs ${new Date(ep.releaseDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
              : p > 0 && !ep.completed
                ? `${Math.round(p * 100)}% watched`
                : ep.duration
                  ? `${ep.duration} min`
                  : ""}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

/** Season selector + episode rows. Watched episodes are dimmed with a check; partial ones show progress. */
export function EpisodeList({ seasons, animeId }: { seasons: SeasonEpisodes[]; animeId: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [animeId]);
  if (!seasons.length || seasons.every((s) => s.episodes.length === 0)) {
    return <EmptyState icon="film-outline" title="No episodes yet" message="Episodes will appear here once they are available." />;
  }
  const season = seasons[Math.min(active, seasons.length - 1)];
  return (
    <View>
      {seasons.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
          {seasons.map((s, i) => (
            <Chip key={s.id} label={s.title} active={i === active} onPress={() => setActive(i)} />
          ))}
        </ScrollView>
      ) : (
        <Text className="text-muted px-4 pb-1 text-sm font-semibold">{season.title}</Text>
      )}
      <View className="border-line mx-4 mb-1 border-b" />
      {season.episodes.map((e) => (
        <EpisodeRow key={e.id} ep={e} animeId={animeId} />
      ))}
    </View>
  );
}
