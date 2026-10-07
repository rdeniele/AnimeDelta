import { useEvent, useEventListener } from "expo";
import * as Brightness from "expo-brightness";
import * as ScreenOrientation from "expo-screen-orientation";
import { VideoView, isPictureInPictureSupported, useVideoPlayer } from "expo-video";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StatusBar, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { api } from "@/lib/api";
import { usePrefs } from "@/store/prefs";
import { toast } from "@/store/ui";
import type { Playback } from "@/types";
import { Button } from "../common/Button";
import { PlayerControls } from "./PlayerControls";
import { QualitySelector, SpeedSelector, SubtitleSelector } from "./OptionSheets";
import { SubtitleOverlay } from "./SubtitleOverlay";

const HIDE_AFTER_MS = 3200;
const SAVE_EVERY_MS = 10000;
const NEXT_COUNTDOWN = 6;

function initialQuality(p: Playback["video"] & object, pref: string) {
  const q = p.qualities;
  if (!q.length) return p.url;
  if (pref === "low") return q[q.length - 1].url;
  if (pref === "high") return (q.find((x) => /1080|1440|2160|high|best/i.test(x.label)) ?? q[0]).url;
  return q[0].url;
}

export function VideoPlayer({ data }: { data: Playback }) {
  const video = data.video!;
  const router = useRouter();
  const qc = useQueryClient();
  const prefs = usePrefs();
  const animeId = data.episode.animeId;
  const episodeId = data.episode.id;

  const [quality, setQuality] = useState(() => initialQuality(video, prefs.quality));
  const [controls, setControls] = useState(true);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [sheet, setSheet] = useState<null | "subs" | "quality" | "speed">(null);
  const [subLang, setSubLang] = useState(() => (prefs.subtitleLang !== "off" && data.subtitles.some((s) => s.language === prefs.subtitleLang) ? prefs.subtitleLang : "off"));
  const [hud, setHud] = useState<{ icon: string; text: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [landscape, setLandscape] = useState(true);

  const videoRef = useRef<VideoView>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumed = useRef(false);
  const latest = useRef({ time: 0, duration: 0 });
  const gestureStart = useRef({ brightness: 0.5, volume: 1 });

  const player = useVideoPlayer({ uri: quality }, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  /* ---- controls visibility ---- */
  const poke = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), HIDE_AFTER_MS);
  }, []);
  useEffect(() => {
    if (!isPlaying && hideTimer.current) {
      clearTimeout(hideTimer.current);
      setControls(true);
    } else if (isPlaying) poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isPlaying, poke]);

  /* ---- progress persistence ---- */
  const save = useCallback(
    (completed = false) => {
      const { time: t, duration: d } = latest.current;
      if (d <= 0 || (t < 3 && !completed)) return;
      void api("/watch-progress", {
        method: "POST",
        body: { episodeId, progressSeconds: Math.round(completed ? d : t), durationSeconds: Math.round(d) },
      }).catch(() => {});
    },
    [episodeId],
  );

  useEffect(() => {
    const id = setInterval(() => player.playing && save(), SAVE_EVERY_MS);
    const sub = AppState.addEventListener("change", (s) => s !== "active" && save());
    return () => {
      clearInterval(id);
      sub.remove();
      save();
      // Refresh anything that shows progress (home rails, episode rows, history).
      setTimeout(() => {
        for (const k of ["home", "episodes", "history"]) void qc.invalidateQueries({ queryKey: [k] });
      }, 600);
    };
  }, [player, save, qc]);

  /* ---- events ---- */
  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    latest.current.time = currentTime;
    latest.current.duration = player.duration || latest.current.duration;
    setTime(currentTime);
  });

  useEventListener(player, "statusChange", ({ status, error: err }) => {
    if (status === "error") setError(err?.message ?? "Video unavailable");
    if (status === "readyToPlay" && !resumed.current) {
      resumed.current = true;
      const p = data.progress;
      if (p && !p.completed && p.progressSeconds > 5 && player.duration > 0 && p.progressSeconds < player.duration - 10) {
        player.currentTime = p.progressSeconds; // resume where the user left off
        toast(`Resumed at ${Math.floor(p.progressSeconds / 60)}:${String(p.progressSeconds % 60).padStart(2, "0")}`);
      }
    }
  });

  const goTo = useCallback((id: string) => router.replace(`/player/${animeId}/${id}`), [router, animeId]);

  useEventListener(player, "playToEnd", () => {
    save(true);
    if (data.next && prefs.autoplayNext) setCountdown(NEXT_COUNTDOWN);
    else setControls(true);
  });

  useEffect(() => {
    if (countdown == null) return;
    if (countdown <= 0) {
      if (data.next) goTo(data.next.id);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, data.next, goTo]);

  /* ---- orientation / status bar ---- */
  useEffect(() => {
    if (Platform.OS === "web") return;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    StatusBar.setHidden(true, "fade");
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => {});
      StatusBar.setHidden(false, "fade");
    };
  }, []);

  const toggleOrientation = async () => {
    if (Platform.OS === "web") return;
    const next = landscape ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE;
    await ScreenOrientation.lockAsync(next).catch(() => {});
    setLandscape(!landscape);
  };

  /* ---- actions ---- */
  const seekTo = (t: number) => {
    player.currentTime = Math.max(0, Math.min(t, player.duration || t));
    setTime(player.currentTime);
  };
  const seekBy = (s: number) => {
    seekTo(player.currentTime + s);
    flash(s > 0 ? "play-forward" : "play-back", `${s > 0 ? "+" : ""}${s}s`);
    poke();
  };
  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
    poke();
  };
  const flash = (icon: string, text: string) => {
    setHud({ icon, text });
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(null), 800);
  };

  const changeQuality = async (url: string) => {
    const at = player.currentTime;
    setSheet(null);
    setQuality(url);
    try {
      await player.replaceAsync({ uri: url });
      player.currentTime = at;
      player.play();
    } catch {
      toast("Couldn't switch quality", "error");
    }
  };

  /* ---- gestures ---- */
  const width = useRef(1);
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDelay(280)
    .onEnd((e, ok) => ok && seekBy(e.x < width.current / 2 ? -10 : 10));
  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((_e, ok) => {
      if (!ok) return;
      if (controls) setControls(false);
      else poke();
    });
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY([-14, 14])
    .failOffsetX([-24, 24])
    .onBegin(() => {
      gestureStart.current.volume = player.volume;
      void Brightness.getBrightnessAsync().then((b) => (gestureStart.current.brightness = b)).catch(() => {});
    })
    .onUpdate((e) => {
      const delta = -e.translationY / 260;
      if (e.x < width.current / 2) {
        const b = Math.max(0.05, Math.min(1, gestureStart.current.brightness + delta));
        void Brightness.setBrightnessAsync(b).catch(() => {});
        flash("sunny", `${Math.round(b * 100)}%`);
      } else {
        const v = Math.max(0, Math.min(1, gestureStart.current.volume + delta));
        player.volume = v;
        flash(v === 0 ? "volume-mute" : "volume-high", `${Math.round(v * 100)}%`);
      }
    });
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onEnd((e) => {
      if (e.scale > 1.12) {
        setFit("cover");
        flash("expand", "Fill");
      } else if (e.scale < 0.9) {
        setFit("contain");
        flash("contract", "Fit");
      }
    });
  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const subTrack = data.subtitles.find((s) => s.language === subLang) ?? null;
  const intro = video.introStart != null && video.introEnd != null && time >= video.introStart && time < video.introEnd - 1;

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-8">
        <Text className="text-xl font-bold text-white">Video unavailable</Text>
        <Text className="text-center text-white/70">{error}</Text>
        <View className="flex-row gap-3">
          <Button label="Retry" onPress={() => { setError(null); void player.replaceAsync({ uri: quality }).then(() => player.play()); }} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" onLayout={(e) => (width.current = e.nativeEvent.layout.width)}>
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1 }} accessibilityLabel="Video. Tap to show controls, double tap sides to seek.">
          <VideoView
            ref={videoRef}
            player={player}
            style={{ flex: 1 }}
            contentFit={fit}
            nativeControls={false}
            allowsPictureInPicture
            pointerEvents="none"
          />
        </View>
      </GestureDetector>

      <SubtitleOverlay url={subTrack?.url ?? null} time={time} raised={controls} />

      {hud ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="rounded-2xl bg-black/65 px-5 py-3">
            <Text className="text-lg font-bold text-white">{hud.text}</Text>
          </View>
        </View>
      ) : null}

      {intro ? (
        <View className="absolute right-6 bottom-28">
          <Button label="Skip Intro" icon="play-forward" variant="secondary" compact onPress={() => seekTo(video.introEnd!)} />
        </View>
      ) : null}

      {countdown != null && data.next ? (
        <View className="absolute right-6 bottom-28 w-72 rounded-2xl border border-white/20 bg-black/80 p-4">
          <Text className="text-xs font-semibold text-white/70">Up next in {countdown}s</Text>
          <Text numberOfLines={1} className="mt-0.5 text-base font-bold text-white">
            Episode {data.next.episodeNumber}
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Button label="Play now" compact onPress={() => goTo(data.next!.id)} />
            <Pressable onPress={() => setCountdown(null)} accessibilityRole="button" className="rounded-full px-4 py-2 active:opacity-70">
              <Text className="font-semibold text-white">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <PlayerControls
        visible={controls}
        title={data.episode.anime.title}
        subtitle={`Episode ${data.episode.episodeNumber}${data.episode.title ? ` • ${data.episode.title.replace(/^Episode \d+: /, "")}` : ""}`}
        playing={isPlaying}
        time={time}
        duration={player.duration || latest.current.duration}
        hasPrev={!!data.previous}
        hasNext={!!data.next}
        muted={muted}
        speed={speed}
        subtitleLabel={subTrack?.label ?? "Off"}
        showQuality={video.qualities.length > 1}
        showPip={Platform.OS !== "web" && isPictureInPictureSupported()}
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        onTogglePlay={togglePlay}
        onSeekBy={seekBy}
        onScrub={() => poke()}
        onCommit={(t) => {
          seekTo(t);
          poke();
        }}
        onPrev={() => data.previous && goTo(data.previous.id)}
        onNext={() => data.next && goTo(data.next.id)}
        onSpeed={() => setSheet("speed")}
        onSubtitles={() => setSheet("subs")}
        onQuality={() => setSheet("quality")}
        onPip={() => void videoRef.current?.startPictureInPicture()}
        onMute={() => {
          player.muted = !muted;
          setMuted(!muted);
        }}
        onOrientation={toggleOrientation}
      />

      <SubtitleSelector
        visible={sheet === "subs"}
        onClose={() => setSheet(null)}
        tracks={data.subtitles}
        value={subLang}
        onSelect={(l) => {
          setSubLang(l);
          prefs.set({ subtitleLang: l }); // remembered for next time
          setSheet(null);
        }}
      />
      <QualitySelector visible={sheet === "quality"} onClose={() => setSheet(null)} qualities={video.qualities} value={quality} onSelect={changeQuality} />
      <SpeedSelector
        visible={sheet === "speed"}
        onClose={() => setSheet(null)}
        value={speed}
        onSelect={(s) => {
          player.playbackRate = s;
          setSpeed(s);
          setSheet(null);
        }}
      />
    </View>
  );
}
