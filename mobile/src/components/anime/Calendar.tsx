import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { toISODate } from "@/lib/format";
import { MONTHS } from "@/types";

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** Monday-first month grid with release dots. */
export function Calendar({
  year,
  month, // 0-based
  selected,
  counts,
  onSelect,
  onMonthChange,
}: {
  year: number;
  month: number;
  selected: string;
  counts: Record<string, number>;
  onSelect: (iso: string) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
  }, [year, month]);
  const today = toISODate(new Date());
  const shift = (d: number) => {
    const n = new Date(year, month + d, 1);
    onMonthChange(n.getFullYear(), n.getMonth());
  };

  return (
    <View className="bg-surface border-line mx-4 rounded-3xl border p-3">
      <View className="mb-2 flex-row items-center justify-between px-1">
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={10} onPress={() => shift(-1)} className="p-1.5 active:opacity-60">
          <Ionicons name="chevron-back" size={20} color="#a99fc4" />
        </Pressable>
        <Text accessibilityRole="header" className="text-fg text-base font-bold">
          {MONTHS[month]} {year}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={10} onPress={() => shift(1)} className="p-1.5 active:opacity-60">
          <Ionicons name="chevron-forward" size={20} color="#a99fc4" />
        </Pressable>
      </View>
      <View className="flex-row">
        {DOW.map((d) => (
          <Text key={d} className="text-muted flex-1 py-1 text-center text-[10px] font-bold">
            {d}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
          const iso = toISODate(d);
          const isSel = iso === selected;
          const n = counts[iso] ?? 0;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${d.toDateString()}${n ? `, ${n} releases` : ""}`}
              accessibilityState={{ selected: isSel }}
              onPress={() => onSelect(iso)}
              style={{ width: `${100 / 7}%`, height: 44 }}
              className="items-center justify-center"
            >
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${isSel ? "bg-primary" : iso === today ? "border-accent border" : ""}`}
              >
                <Text className={`text-sm font-semibold ${isSel ? "text-white" : "text-fg"}`}>{d.getDate()}</Text>
                {n > 0 ? <View className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSel ? "bg-white" : "bg-accent"}`} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
