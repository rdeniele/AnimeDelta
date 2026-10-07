import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Chip } from "@/components/common/Button";
import { EmptyState, ErrorState, OfflineBanner } from "@/components/common/States";
import { Header } from "@/components/navigation/Header";
import { useMyList } from "@/hooks/queries";
import { LIST_LABELS, type ListStatus } from "@/types";
import { useRouter } from "expo-router";

type Tab = "ALL" | ListStatus;
const TABS: Tab[] = ["ALL", "WATCHING", "PLAN_TO_WATCH", "COMPLETED", "DROPPED"];

export default function MyList() {
  const [tab, setTab] = useState<Tab>("ALL");
  const router = useRouter();
  const q = useMyList();
  const items = useMemo(() => q.data ?? [], [q.data]);
  const shown = useMemo(() => (tab === "ALL" ? items : items.filter((i) => i.status === tab)), [items, tab]);
  const count = (t: Tab) => (t === "ALL" ? items.length : items.filter((i) => i.status === t).length);

  const header = (
    <View>
      <Header title="My List" subtitle="Long press an anime to change its status" />
      <OfflineBanner />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-4">
        {TABS.map((t) => (
          <Chip key={t} label={`${t === "ALL" ? "All" : LIST_LABELS[t]} · ${count(t)}`} active={tab === t} onPress={() => setTab(t)} />
        ))}
      </ScrollView>
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
      items={shown.map((i) => i.anime)}
      loading={q.isLoading}
      header={header}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      empty={
        <EmptyState
          icon="bookmark-outline"
          title={tab === "ALL" ? "Your list is empty" : `Nothing in ${LIST_LABELS[tab as ListStatus]}`}
          message="Add anime from any card with a long press, or from its detail page."
          actionLabel="Browse anime"
          onAction={() => router.push("/browse")}
        />
      }
    />
  );
}
