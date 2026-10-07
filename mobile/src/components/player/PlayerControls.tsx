import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fmtTime } from "@/lib/format";
import { IconButton } from "../common/Button";
import { SeekBar } from "./SeekBar";

type IconName = keyof typeof Ionicons.glyphMap;

function Pill({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-70 ${active ? "bg-primary" : "bg-white/15"}`}
    >
      <Ionicons name={icon} size={16} color="#fff" />
      <Text className="text-xs font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

export interface ControlsProps {
  visible: boolean;
  title: string;
  subtitle: string;
  playing: boolean;
  time: number;
  duration: number;
  hasPrev: boolean;
  hasNext: boolean;
  muted: boolean;
  speed: number;
  subtitleLabel: string;
  showQuality: boolean;
  showPip: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  onSeekBy: (s: number) => void;
  onScrub: (t: number) => void;
  onCommit: (t: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: () => void;
  onSubtitles: () => void;
  onQuality: () => void;
  onPip: () => void;
  onMute: () => void;
  onOrientation: () => void;
}

/** Fading control overlay. Becomes non-interactive while hidden so taps reach the gesture layer. */
export function PlayerControls(p: ControlsProps) {
  const insets = useSafeAreaInsets();
  const fade = useAnimatedStyle(() => ({ opacity: withTiming(p.visible ? 1 : 0, { duration: 200 }) }));
  return (
    <Animated.View pointerEvents={p.visible ? "box-none" : "none"} style={[{ position: "absolute", inset: 0 }, fade]}>
      <LinearGradient colors={["rgba(0,0,0,0.75)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }} pointerEvents="none" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 170 }} pointerEvents="none" />

      <View
        pointerEvents="box-none"
        className="absolute top-0 right-0 left-0 flex-row items-center gap-2"
        style={{ paddingTop: Math.max(insets.top, 10), paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12) }}
      >
        <IconButton icon="chevron-back" label="Back" onPress={p.onBack} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-bold text-white">
            {p.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-white/70">
            {p.subtitle}
          </Text>
        </View>
      </View>

      <View pointerEvents="box-none" className="absolute inset-0 flex-row items-center justify-center gap-5">
        <View className={p.hasPrev ? "" : "opacity-30"}>
          <IconButton icon="play-skip-back" label="Previous episode" size={26} onPress={p.hasPrev ? p.onPrev : undefined} filled />
        </View>
        <IconButton icon="play-back" label="Rewind 10 seconds" size={26} onPress={() => p.onSeekBy(-10)} filled />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.playing ? "Pause" : "Play"}
          onPress={p.onTogglePlay}
          className="h-16 w-16 items-center justify-center rounded-full bg-black/55 active:opacity-70"
        >
          <Ionicons name={p.playing ? "pause" : "play"} size={34} color="#fff" />
        </Pressable>
        <IconButton icon="play-forward" label="Forward 10 seconds" size={26} onPress={() => p.onSeekBy(10)} filled />
        <View className={p.hasNext ? "" : "opacity-30"}>
          <IconButton icon="play-skip-forward" label="Next episode" size={26} onPress={p.hasNext ? p.onNext : undefined} filled />
        </View>
      </View>

      <View
        pointerEvents="box-none"
        className="absolute right-0 bottom-0 left-0"
        style={{ paddingBottom: Math.max(insets.bottom, 10), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }}
      >
        <View className="flex-row items-center gap-3">
          <Text className="w-12 text-xs font-medium text-white tabular-nums">{fmtTime(p.time)}</Text>
          <View className="flex-1">
            <SeekBar position={p.time} duration={p.duration} onScrub={p.onScrub} onCommit={p.onCommit} />
          </View>
          <Text className="w-12 text-right text-xs font-medium text-white tabular-nums">{fmtTime(p.duration)}</Text>
        </View>
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <Pill icon="speedometer-outline" label={p.speed === 1 ? "1x" : `${p.speed}x`} onPress={p.onSpeed} active={p.speed !== 1} />
          <Pill icon="chatbox-ellipses-outline" label={p.subtitleLabel} onPress={p.onSubtitles} active={p.subtitleLabel !== "Off"} />
          {p.showQuality ? <Pill icon="options-outline" label="Quality" onPress={p.onQuality} /> : null}
          <View className="flex-1" />
          <IconButton icon={p.muted ? "volume-mute" : "volume-high"} label={p.muted ? "Unmute" : "Mute"} size={20} onPress={p.onMute} />
          {p.showPip ? <IconButton icon="albums-outline" label="Picture in picture" size={20} onPress={p.onPip} /> : null}
          <IconButton icon="phone-landscape-outline" label="Toggle fullscreen orientation" size={20} onPress={p.onOrientation} />
        </View>
      </View>
    </Animated.View>
  );
}
