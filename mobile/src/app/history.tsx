import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Art } from "@/components/anime/Art";
import { PressableScale } from "@/components/anime/PressableScale";
import { ConfirmDialog } from "@/components/common/BottomSheet";
import { ProgressBar } from "@/components/common/Button";
import { EmptyState, ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/common/Skeleton";
import { Header } from "@/components/navigation/Header";
import { useClearHistory, useHistory, useRemoveHistory } from "@/hooks/queries";
import { fmtTime, pct, timeAgo } from "@/lib/format";
import type { ProgressItem } from "@/types";

function Row({ item, onRemove }: { item: ProgressItem; onRemove: () => void }) {
  const router = useRouter();
  const p = pct(item.progressSeconds, item.durationSeconds);
  return (
    <View className="flex-row items-center gap-3 px-4 py-2.5">
      <PressableScale
        style={{ flex: 1 }}
        onPress={() => router.push(`/player/${item.animeId}/${item.episodeId}`)}
        label={`${item.anime.title} episode ${item.episode.episodeNumber}`}
      >
        <View className="flex-row items-center gap-3">
          <View>
            <Art uri={item.episode.thumbnail ?? item.anime.bannerImage} radius={10} style={{ width: 128, height: 72 }} />
            <View className="absolute right-1.5 bottom-1.5 left-1.5">
              <ProgressBar value={item.completed ? 1 : p} height={3} />
            </View>
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-fg text-[15px] font-bold">
              {item.anime.title}
            </Text>
            <Text className="text-muted text-[13px]">Episode {item.episode.episodeNumber}</Text>
            <Text className="text-muted text-xs">
              {item.completed ? "Watched" : `${fmtTime(item.progressSeconds)} / ${fmtTime(item.durationSeconds)}`} • {timeAgo(item.updatedAt)}
            </Text>
          </View>
        </View>
      </PressableScale>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.anime.title} from history`} hitSlop={10} onPress={onRemove} className="p-2 active:opacity-60">
        <Ionicons name="close" size={20} color="#a99fc4" />
      </Pressable>
    </View>
  );
}

export default function History() {
  const q = useHistory();
  const remove = useRemoveHistory();
  const clear = useClearHistory();
  const [confirm, setConfirm] = useState(false);
  const items = q.data ?? [];

  return (
    <View className="flex-1">
      <Header
        title="History"
        back
        right={
          items.length ? (
            <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} hitSlop={8} className="px-2 py-2 active:opacity-60">
              <Text className="text-danger text-sm font-semibold">Clear</Text>
            </Pressable>
          ) : undefined
        }
      />
      {q.isLoading ? (
        <View className="gap-3 px-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} />
          ))}
        </View>
      ) : q.isError && !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Row item={item} onRemove={() => remove.mutate(item.animeId)} />}
          ListHeaderComponent={items.length ? <Text className="text-fg mb-1 px-4 text-lg font-bold">Recently Watched</Text> : null}
          ListEmptyComponent={<EmptyState icon="time-outline" title="No watch history" message="Anime you watch will show up here." />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
      <ConfirmDialog
        visible={confirm}
        title="Clear watch history?"
        message="This removes all recently watched items and your saved playback positions."
        confirmLabel="Clear history"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          clear.mutate();
        }}
      />
    </View>
  );
}
