import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { usePrefs } from "@/store/prefs";
import type { Playback } from "@/types";
import { Button, IconButton } from "../common/Button";
import { YouTubeEmbed, type EmbedHandle } from "./YouTubeEmbed";

const SAVE_EVERY_MS = 10000;
const COUNTDOWN = 6;

export const youTubeId = (url: string) => /[?&]v=([\w-]{11})/.exec(url)?.[1] ?? /youtu\.be\/([\w-]{11})/.exec(url)?.[1] ?? null;

/**
 * Plays official YouTube releases through YouTube's embedded player (as its terms require).
 * Navigation, auto-next and watch progress work like the native player; captions, quality and
 * speed are managed by YouTube's own controls.
 */
export function YouTubeEpisodePlayer({ data }: { data: Playback }) {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const autoplayNext = usePrefs((s) => s.autoplayNext);
  const embed = useRef<EmbedHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoId = youTubeId(data.video!.url);
  const episodeId = data.episode.id;
  const animeId = data.episode.animeId;
  const landscape = width > height;
  const w = landscape ? Math.min(width - insets.left - insets.right, ((height - insets.top - insets.bottom) * 16) / 9) : width;
  const h = Math.round((w * 9) / 16);
  const start = data.progress && !data.progress.completed && data.progress.progressSeconds > 5 ? data.progress.progressSeconds : 0;

  const save = useCallback(
    async (completed = false) => {
      const [t, d] = await Promise.all([embed.current?.getCurrentTime() ?? 0, embed.current?.getDuration() ?? 0]).catch(() => [0, 0]);
      if (d <= 0) return;
      void api("/watch-progress", {
        method: "POST",
        body: { episodeId, progressSeconds: Math.round(completed ? d : t), durationSeconds: Math.round(d) },
      }).catch(() => {});
    },
    [episodeId],
  );

  useEffect(() => {
    const id = setInterval(() => void save(), SAVE_EVERY_MS);
    const sub = AppState.addEventListener("change", (s) => s !== "active" && void save());
    return () => {
      clearInterval(id);
      sub.remove();
      void save();
      setTimeout(() => {
        for (const k of ["home", "episodes", "history"]) void qc.invalidateQueries({ queryKey: [k] });
      }, 800);
    };
  }, [save, qc]);

  const goTo = (id: string) => router.replace(`/player/${animeId}/${id}`);

  useEffect(() => {
    if (countdown == null) return;
    if (countdown <= 0) {
      if (data.next) goTo(data.next.id);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtitle = `Episode ${data.episode.episodeNumber}${data.episode.title ? ` • ${data.episode.title.replace(/^Episode \d+: /, "")}` : ""}`;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: landscape ? 0 : insets.top }}>
      {!landscape ? (
        <View className="flex-row items-center gap-2 px-2 pb-2">
          <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-bold text-white">
              {data.episode.anime.title}
            </Text>
            <Text numberOfLines={1} className="text-xs text-white/70">
              {subtitle}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ alignItems: "center", flex: landscape ? 1 : undefined, justifyContent: landscape ? "center" : undefined }}>
        {landscape ? (
          <View className="absolute top-2 left-2 z-10" style={{ left: Math.max(insets.left, 8) }}>
            <IconButton icon="chevron-back" label="Back" filled onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
          </View>
        ) : null}
        {videoId && !error ? (
          <YouTubeEmbed
            key={videoId}
            ref={embed}
            videoId={videoId}
            width={w}
            height={h}
            startSeconds={start}
            onError={(c) => setError(c)}
            onEnded={() => {
              void save(true);
              if (data.next && autoplayNext) setCountdown(COUNTDOWN);
            }}
          />
        ) : (
          <View className="items-center justify-center gap-3 px-8" style={{ width: w, height: h }}>
            <Text className="text-center text-base font-semibold text-white">This video can&apos;t be played inside the app.</Text>
            <Button label="Watch on YouTube" icon="logo-youtube" onPress={() => void Linking.openURL(data.video!.url)} compact />
          </View>
        )}
      </View>

      {!landscape ? (
        <View className="gap-3 px-4 pt-4">
          {countdown != null && data.next ? (
            <View className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <Text className="text-xs font-semibold text-white/70">Up next in {countdown}s</Text>
              <Text numberOfLines={1} className="mt-0.5 text-base font-bold text-white">
                Episode {data.next.episodeNumber}
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Button label="Play now" compact onPress={() => goTo(data.next!.id)} />
                <Button label="Cancel" variant="ghost" compact onPress={() => setCountdown(null)} />
              </View>
            </View>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Previous" icon="play-skip-back" variant="secondary" disabled={!data.previous} onPress={() => data.previous && goTo(data.previous.id)} />
            </View>
            <View className="flex-1">
              <Button label="Next" icon="play-skip-forward" variant="secondary" disabled={!data.next} onPress={() => data.next && goTo(data.next.id)} />
            </View>
          </View>
          <Text className="text-xs text-white/50">Official release streamed with YouTube&apos;s player. Captions, quality and speed are in its settings.</Text>
        </View>
      ) : null}
    </View>
  );
}
