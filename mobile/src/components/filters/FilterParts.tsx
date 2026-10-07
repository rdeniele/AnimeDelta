import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { yearOptions } from "@/lib/filters";
import { MONTHS, SEASON_LABELS, SORT_LABELS, type AnimeSeason, type SortKey } from "@/types";
import { Chip } from "../common/Button";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-muted mb-2.5 px-5 text-xs font-bold tracking-wider uppercase">{title}</Text>
      {children}
    </View>
  );
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-2 px-5">{children}</View>;
}

export function GenreFilter({ genres, selected, onToggle }: { genres: string[]; selected: string[]; onToggle: (g: string) => void }) {
  return (
    <Section title="Genres">
      <ChipWrap>
        {genres.map((g) => (
          <Chip key={g} label={g} active={selected.includes(g)} onPress={() => onToggle(g)} />
        ))}
      </ChipWrap>
    </Section>
  );
}

export function YearFilter({ year, onChange }: { year?: number; onChange: (y?: number) => void }) {
  return (
    <Section title="Year">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <Chip label="Any" active={!year} onPress={() => onChange(undefined)} />
        {yearOptions().map((y) => (
          <Chip key={y} label={String(y)} active={year === y} onPress={() => onChange(year === y ? undefined : y)} />
        ))}
      </ScrollView>
    </Section>
  );
}

export function MonthFilter({ month, onChange }: { month?: number; onChange: (m?: number) => void }) {
  return (
    <Section title="Month">
      <ChipWrap>
        {MONTHS.map((m, i) => (
          <Chip key={m} label={m} active={month === i + 1} onPress={() => onChange(month === i + 1 ? undefined : i + 1)} />
        ))}
      </ChipWrap>
    </Section>
  );
}

export function SeasonFilter({ season, onChange }: { season?: AnimeSeason; onChange: (s?: AnimeSeason) => void }) {
  return (
    <Section title="Season">
      <ChipWrap>
        {(Object.keys(SEASON_LABELS) as AnimeSeason[]).map((s) => (
          <Chip key={s} label={SEASON_LABELS[s]} active={season === s} onPress={() => onChange(season === s ? undefined : s)} />
        ))}
      </ChipWrap>
    </Section>
  );
}

export function OptionFilter<T extends string | number>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T | undefined; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <Section title={title}>
      <ChipWrap>
        {options.map((o) => (
          <Chip key={o.label} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} />
        ))}
      </ChipWrap>
    </Section>
  );
}

export function SortSelector({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  return (
    <Section title="Sort by">
      <ChipWrap>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((s) => (
          <Chip key={s} label={SORT_LABELS[s]} active={sort === s} onPress={() => onChange(s)} />
        ))}
      </ChipWrap>
    </Section>
  );
}
