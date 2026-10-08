import type { ReactElement } from "react";
import { FlatList, RefreshControl, View, type StyleProp, type ViewStyle } from "react-native";
import { useGridMetrics } from "@/hooks/useGrid";
import type { AnimeCard } from "@/types";
import { GridSkeleton } from "../common/Skeleton";
import { PosterCard } from "./AnimeCard";

/** Responsive poster grid with infinite scroll. Column count changes remount the list. */
export function AnimeGrid({
  items,
  loading,
  onEnd,
  fetchingMore,
  header,
  empty,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  items: AnimeCard[];
  loading?: boolean;
  onEnd?: () => void;
  fetchingMore?: boolean;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { columns, cardWidth, gap } = useGridMetrics();
  return (
    <FlatList
      key={columns}
      data={loading ? [] : items}
      numColumns={columns}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <GridSkeleton columns={columns} cardWidth={cardWidth} /> : empty}
      ListFooterComponent={fetchingMore ? <GridSkeleton columns={columns} cardWidth={cardWidth} rows={1} /> : <View style={{ height: 24 }} />}
      columnWrapperStyle={columns > 1 ? { gap, paddingHorizontal: 16, marginBottom: 16 } : undefined}
      contentContainerStyle={contentStyle}
      onEndReached={onEnd}
      onEndReachedThreshold={0.6}
      initialNumToRender={columns * 3}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#e11d48" /> : undefined}
      renderItem={({ item }) => <PosterCard anime={item} width={cardWidth} />}
    />
  );
}
