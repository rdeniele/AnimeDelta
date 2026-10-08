import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Chip } from "@/components/common/Button";
import { EmptyState, ErrorState } from "@/components/common/States";
import { Header } from "@/components/navigation/Header";
import { useGenres, useSeasonAnime } from "@/hooks/queries";
import { currentSeason } from "@/lib/format";
import { FALLBACK_GENRES } from "@/lib/filters";
import { SEASON_LABELS, type AnimeSeason } from "@/types";

const SEASONS: AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

export default function Seasonal() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState<AnimeSeason>(currentSeason());
  const [genre, setGenre] = useState<string | undefined>();
  const genres = useGenres();
  const q = useSeasonAnime(year, season, genre);
  const names = genres.data?.length ? genres.data.map((g) => g.name) : FALLBACK_GENRES;

  const header = (
    <View>
      <Header title="Seasonal" back />
      <View className="mb-3 flex-row items-center justify-center gap-4">
        <Pressable accessibilityRole="button" accessibilityLabel="Previous year" hitSlop={10} onPress={() => setYear(year - 1)} className="p-2 active:opacity-60">
          <Ionicons name="chevron-back" size={20} color="#a79ba8" />
        </Pressable>
        <Text className="text-fg text-lg font-bold">{year}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next year" hitSlop={10} onPress={() => setYear(year + 1)} className="p-2 active:opacity-60">
          <Ionicons name="chevron-forward" size={20} color="#a79ba8" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-3">
        {SEASONS.map((s) => (
          <Chip key={s} label={`${SEASON_LABELS[s]} ${year}`} active={s === season} onPress={() => setSeason(s)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-4">
        <Chip label="All" active={!genre} onPress={() => setGenre(undefined)} />
        {names.map((g) => (
          <Chip key={g} label={g} active={genre === g} onPress={() => setGenre(genre === g ? undefined : g)} />
        ))}
      </ScrollView>
      <Text className="text-fg mb-3 px-4 text-xl font-bold">
        {SEASON_LABELS[season]} {year} Anime
      </Text>
    </View>
  );

  if (q.isError && !q.data) {
    return (
      <View className="flex-1">
        {header}
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </View>
    );
  }
  return (
    <AnimeGrid
      items={q.data ?? []}
      loading={q.isLoading}
      header={header}
      empty={<EmptyState icon="leaf-outline" title="No anime this season" message="Try another season or year, or clear the genre." />}
    />
  );
}
