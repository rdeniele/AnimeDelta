import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Chip } from "@/components/common/Button";
import { EmptyState, ErrorState, OfflineBanner } from "@/components/common/States";
import { FilterSheet, SortSheet } from "@/components/filters/FilterSheet";
import { Header } from "@/components/navigation/Header";
import { useBrowse } from "@/hooks/queries";
import { activeChips, activeCount, DEFAULT_FILTERS, sortLabel } from "@/lib/filters";
import type { Filters } from "@/types";

export default function Browse() {
  const router = useRouter();
  const params = useLocalSearchParams<{ genre?: string }>();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);

  // Deep link from Home genre chips
  useEffect(() => {
    if (params.genre) setFilters({ ...DEFAULT_FILTERS, genres: [params.genre] });
  }, [params.genre]);

  const q = useBrowse(filters);
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const total = q.data?.pages[0]?.total;
  const chips = activeChips(filters);

  const quick = [
    { label: "Genres", icon: "pricetags-outline" as const, onPress: () => setSheet("filters") },
    { label: "Seasons", icon: "leaf-outline" as const, onPress: () => router.push("/seasonal") },
    { label: "Years", icon: "calendar-outline" as const, onPress: () => setSheet("filters") },
    { label: "Status", icon: "pulse-outline" as const, onPress: () => setSheet("filters") },
    { label: "Type", icon: "tv-outline" as const, onPress: () => setSheet("filters") },
    { label: "New", icon: "sparkles-outline" as const, onPress: () => router.push("/new-anime") },
  ];

  const header = (
    <View>
      <Header title="Browse Anime" />
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search anime"
        onPress={() => router.push("/search")}
        className="bg-surface border-line mx-4 mb-4 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      >
        <Ionicons name="search" size={18} color="#a79ba8" />
        <Text className="text-muted text-base">Search anime...</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-5">
        {quick.map((c) => (
          <Chip key={c.label} label={c.label} icon={c.icon} onPress={c.onPress} />
        ))}
      </ScrollView>
      <OfflineBanner />
      <View className="mb-3 flex-row flex-wrap items-center justify-between gap-y-2 px-4">
        <View>
          <Text className="text-fg text-xl font-bold">All Anime</Text>
          {total != null ? <Text className="text-muted text-xs">{total} titles</Text> : null}
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => setSheet("filters")}
            className="bg-surface border-line flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-70"
          >
            <Ionicons name="options-outline" size={16} color="#e11d48" />
            <Text className="text-fg text-sm font-semibold">Filters{activeCount(filters) ? ` (${activeCount(filters)})` : ""}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort: ${sortLabel(filters)}`}
            onPress={() => setSheet("sort")}
            className="bg-surface border-line flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-70"
          >
            <Ionicons name="swap-vertical" size={16} color="#e11d48" />
            <Text className="text-fg text-sm font-semibold">{sortLabel(filters)}</Text>
          </Pressable>
        </View>
      </View>
      {chips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-4">
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} active onRemove={() => setFilters(c.remove(filters))} />
          ))}
          <Chip label="Clear all" onPress={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })} />
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1">
      {q.isError && !q.data ? (
        <View className="flex-1">
          {header}
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </View>
      ) : (
        <AnimeGrid
          items={items}
          loading={q.isLoading}
          header={header}
          fetchingMore={q.isFetchingNextPage}
          onEnd={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching && !q.isFetchingNextPage}
          onRefresh={() => q.refetch()}
          empty={
            <EmptyState
              icon="search-outline"
              title="No anime match these filters"
              message="Try removing a filter or two."
              actionLabel="Clear filters"
              onAction={() => setFilters(DEFAULT_FILTERS)}
            />
          }
        />
      )}
      <FilterSheet visible={sheet === "filters"} value={filters} onClose={() => setSheet(null)} onApply={setFilters} />
      <SortSheet visible={sheet === "sort"} value={filters.sort} onClose={() => setSheet(null)} onChange={(sort) => setFilters({ ...filters, sort })} />
    </View>
  );
}
