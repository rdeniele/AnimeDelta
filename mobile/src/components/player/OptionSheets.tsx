import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { SubtitleTrack } from "@/types";
import { BottomSheet } from "../common/BottomSheet";

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} className="flex-row items-center gap-3 rounded-2xl px-3 py-3.5 active:bg-surface2">
      <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? "#8b5cf6" : "#a99fc4"} />
      <Text className={`text-base ${selected ? "text-primary font-bold" : "text-fg"}`}>{label}</Text>
    </Pressable>
  );
}

function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} heightRatio={0.7}>
      <View className="px-3 pb-2">{children}</View>
    </BottomSheet>
  );
}

export function SubtitleSelector({
  visible,
  onClose,
  tracks,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  tracks: SubtitleTrack[];
  value: string;
  onSelect: (lang: string) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Subtitles">
      <Option label="Off" selected={value === "off"} onPress={() => onSelect("off")} />
      {tracks.map((t) => (
        <Option key={t.language} label={t.label} selected={value === t.language} onPress={() => onSelect(t.language)} />
      ))}
    </Sheet>
  );
}

export function QualitySelector({
  visible,
  onClose,
  qualities,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  qualities: { label: string; url: string }[];
  value: string;
  onSelect: (url: string) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Quality">
      {qualities.map((q) => (
        <Option key={q.url} label={q.label} selected={value === q.url} onPress={() => onSelect(q.url)} />
      ))}
    </Sheet>
  );
}

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function SpeedSelector({ visible, onClose, value, onSelect }: { visible: boolean; onClose: () => void; value: number; onSelect: (s: number) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Playback speed">
      {SPEEDS.map((s) => (
        <Option key={s} label={s === 1 ? "Normal" : `${s}x`} selected={value === s} onPress={() => onSelect(s)} />
      ))}
    </Sheet>
  );
}
