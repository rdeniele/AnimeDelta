import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Art } from "@/components/anime/Art";
import { AnimeRail } from "@/components/anime/AnimeRail";
import { Calendar } from "@/components/anime/Calendar";
import { PressableScale } from "@/components/anime/PressableScale";
import { EmptyState, ErrorState, OfflineBanner } from "@/components/common/States";
import { Skeleton } from "@/components/common/Skeleton";
import { Header } from "@/components/navigation/Header";
import { useDayReleases, useMonthSummary, useNewAnime } from "@/hooks/queries";
import { toISODate } from "@/lib/format";

export default function NewAnime() {
  const router = useRouter();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(toISODate(now));
  const month = useMonthSummary(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`);
  const day = useDayReleases(selected);
  const sections = useNewAnime();
  const n = sections.data;

  return (
    <View className="flex-1">
      <Header title="New Anime" back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <OfflineBanner />
        <Calendar
          year={ym.y}
          month={ym.m}
          selected={selected}
          counts={month.data ?? {}}
          onSelect={setSelected}
          onMonthChange={(y, m) => setYm({ y, m })}
        />

        <View className="mt-5 mb-7">
          <Text className="text-fg mb-3 px-4 text-xl font-bold">
            {new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          {day.isLoading ? (
            <View className="gap-3 px-4">
              <Skeleton height={72} />
              <Skeleton height={72} />
            </View>
          ) : day.isError && !day.data ? (
            <ErrorState error={day.error} onRetry={() => day.refetch()} title="Unable to load releases" />
          ) : day.data && (day.data.episodes.length || day.data.premieres.length) ? (
            <View className="gap-2">
              {day.data.premieres.map((a) => (
                <PressableScale key={`p-${a.id}`} onPress={() => router.push(`/anime/${a.id}`)} label={`${a.title} premieres`}>
                  <View className="flex-row items-center gap-3 px-4 py-1.5">
                    <Art uri={a.coverImage} radius={10} style={{ width: 48, height: 72 }} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-fg text-[15px] font-bold">{a.title}</Text>
                      <Text className="text-accent text-xs font-bold">SERIES PREMIERE</Text>
                    </View>
                  </View>
                </PressableScale>
              ))}
              {day.data.episodes.map((e) => (
                <PressableScale key={e.id} onPress={() => router.push(`/anime/${e.anime.id}`)} label={`${e.anime.title} episode ${e.episodeNumber}`}>
                  <View className="flex-row items-center gap-3 px-4 py-1.5">
                    <Art uri={e.thumbnail ?? e.anime.coverImage} radius={10} style={{ width: 112, height: 63 }} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-fg text-[15px] font-bold">{e.anime.title}</Text>
                      <Text className="text-muted text-[13px]">Episode {e.episodeNumber}</Text>
                    </View>
                  </View>
                </PressableScale>
              ))}
            </View>
          ) : (
            <EmptyState icon="calendar-clear-outline" title="Nothing scheduled" message="No releases are listed for this day." />
          )}
        </View>

        {sections.isError && !n ? (
          <ErrorState error={sections.error} onRetry={() => sections.refetch()} />
        ) : (
          <>
            <AnimeRail kind="poster" title="Today" items={n?.today ?? []} loading={sections.isLoading} />
            <AnimeRail kind="poster" title="This Week" items={n?.week ?? []} />
            <AnimeRail kind="poster" title="This Month" items={n?.month ?? []} />
            <AnimeRail kind="poster" title="Recently Added" items={n?.recentlyAdded ?? []} />
            <AnimeRail kind="poster" title="Recently Updated" items={n?.recentlyUpdated ?? []} />
            <AnimeRail kind="poster" title="Upcoming" items={n?.upcoming ?? []} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
