import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { metaLine, seasonLabel } from "@/lib/format";
import { STATUS_LABELS, type AnimeDetail } from "@/types";
import { Chip } from "../common/Button";

export function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2);
  return (
    <View className="flex-row items-center gap-0.5" accessibilityLabel={`Rated ${rating.toFixed(1)} out of 10`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= filled ? "star" : "star-outline"} size={14} color="#fbbf24" />
      ))}
      <Text className="text-fg ml-1.5 text-sm font-bold">{rating.toFixed(1)}</Text>
    </View>
  );
}

export function GenreChips({ genres }: { genres: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {genres.map((g) => (
        <Chip key={g} label={g} />
      ))}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-line flex-row justify-between border-b py-3">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-fg ml-4 flex-1 text-right text-sm font-semibold">{value}</Text>
    </View>
  );
}

export function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <View>
      <Text numberOfLines={open ? undefined : 4} className="text-fg/90 text-[15px] leading-[22px]">
        {text}
      </Text>
      <Pressable onPress={() => setOpen(!open)} hitSlop={8} accessibilityRole="button" className="mt-1.5 self-start">
        <Text className="text-accent text-sm font-semibold">{open ? "Show less" : "Read more"}</Text>
      </Pressable>
    </View>
  );
}

export function AnimeInfo({ anime }: { anime: AnimeDetail }) {
  return (
    <View>
      <Row label="Studio" value={anime.studio ?? "—"} />
      <Row label="Status" value={STATUS_LABELS[anime.status]} />
      <Row label="Season" value={seasonLabel(anime)} />
      <Row label="Year" value={anime.year ? String(anime.year) : "—"} />
      <Row label="Type" value={metaLine(anime).split(" • ")[0]} />
      <Row label="Episodes" value={anime.episodeCount ? String(anime.episodeCount) : "—"} />
      <Row label="Duration" value={anime.duration ? `${anime.duration} min` : "—"} />
    </View>
  );
}
