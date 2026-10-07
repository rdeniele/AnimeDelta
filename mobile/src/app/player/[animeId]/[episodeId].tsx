import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState } from "@/components/common/States";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { usePlayback } from "@/hooks/queries";
import { useUi } from "@/store/ui";

export default function PlayerScreen() {
  const { episodeId } = useLocalSearchParams<{ animeId: string; episodeId: string }>();
  const router = useRouter();
  const online = useUi((s) => s.online);
  const q = usePlayback(episodeId);

  if (q.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#8b5cf6" size="large" />
      </View>
    );
  }

  const back = (
    <View className="items-center pb-8">
      <Button label="Go back" variant="secondary" onPress={() => router.back()} />
    </View>
  );

  if (q.isError || !q.data) {
    return (
      <View className="flex-1 justify-center bg-black">
        <ErrorState
          error={q.error}
          title={online ? "Episode unavailable" : "You're offline"}
          onRetry={() => q.refetch()}
        />
        {back}
      </View>
    );
  }
  if (!q.data.video) {
    return (
      <View className="flex-1 justify-center bg-black">
        <EmptyState icon="videocam-off-outline" title="Video unavailable" message="No media source is configured for this episode, or the provider is unavailable." />
        {back}
      </View>
    );
  }
  return <VideoPlayer key={q.data.episode.id} data={q.data} />;
}
