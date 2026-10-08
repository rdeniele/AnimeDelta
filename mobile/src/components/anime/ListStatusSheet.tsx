import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useListStatusMap, useRemoveFromList, useSetListStatus } from "@/hooks/queries";
import { toast, useUi } from "@/store/ui";
import { LIST_LABELS, type ListStatus } from "@/types";
import { BottomSheet } from "../common/BottomSheet";

const ORDER: ListStatus[] = ["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "DROPPED"];
const ICONS: Record<ListStatus, keyof typeof Ionicons.glyphMap> = {
  WATCHING: "play-circle-outline",
  PLAN_TO_WATCH: "time-outline",
  COMPLETED: "checkmark-circle-outline",
  DROPPED: "close-circle-outline",
};

/** Global sheet (mounted once) used for long-press quick status changes. */
export function ListStatusSheet() {
  const anime = useUi((s) => s.listSheet);
  const close = useUi((s) => s.openListSheet);
  const current = useListStatusMap().get(anime?.id ?? "");
  const set = useSetListStatus();
  const remove = useRemoveFromList();

  return (
    <BottomSheet visible={!!anime} onClose={() => close(null)} title={anime?.title} heightRatio={0.6}>
      <View className="px-3 pb-2">
        {ORDER.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            onPress={() => {
              if (anime) {
                set.mutate({ anime, status: s });
                toast(`Moved to ${LIST_LABELS[s]}`, "success");
              }
              close(null);
            }}
            className="flex-row items-center gap-3 rounded-2xl px-3 py-3.5 active:bg-surface2"
          >
            <Ionicons name={ICONS[s]} size={22} color={current === s ? "#e11d48" : "#a79ba8"} />
            <Text className={`flex-1 text-base ${current === s ? "text-primary font-bold" : "text-fg"}`}>{LIST_LABELS[s]}</Text>
            {current === s ? <Ionicons name="checkmark" size={20} color="#e11d48" /> : null}
          </Pressable>
        ))}
        {current && anime ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              remove.mutate(anime.id);
              toast("Removed from My List");
              close(null);
            }}
            className="flex-row items-center gap-3 rounded-2xl px-3 py-3.5 active:bg-surface2"
          >
            <Ionicons name="trash-outline" size={22} color="#f43f5e" />
            <Text className="text-danger text-base">Remove from My List</Text>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}
