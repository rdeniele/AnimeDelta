import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useGenres } from "@/hooks/queries";
import { DEFAULT_FILTERS, FALLBACK_GENRES } from "@/lib/filters";
import { STATUS_LABELS, type AnimeStatus, type AnimeType, type Filters } from "@/types";
import { BottomSheet } from "../common/BottomSheet";
import { Button } from "../common/Button";
import { GenreFilter, MonthFilter, OptionFilter, SeasonFilter, SortSelector, YearFilter } from "./FilterParts";

const STATUS_OPTIONS: { value: AnimeStatus | undefined; label: string }[] = [
  { value: undefined, label: "Any" },
  { value: "AIRING", label: STATUS_LABELS.AIRING },
  { value: "FINISHED", label: STATUS_LABELS.FINISHED },
  { value: "UPCOMING", label: STATUS_LABELS.UPCOMING },
];
const TYPE_OPTIONS: { value: AnimeType | undefined; label: string }[] = [
  { value: undefined, label: "Any" },
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Special" },
];
const RATING_OPTIONS = [
  { value: undefined, label: "Any" },
  { value: 7, label: "7+" },
  { value: 8, label: "8+" },
  { value: 9, label: "9+" },
];

/** Combinable filters edited as a draft and applied on confirm. */
export function FilterSheet({
  visible,
  value,
  onClose,
  onApply,
  hideSort,
}: {
  visible: boolean;
  value: Filters;
  onClose: () => void;
  onApply: (f: Filters) => void;
  hideSort?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const genres = useGenres();
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const patch = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }));
  const names = genres.data?.length ? genres.data.map((g) => g.name) : FALLBACK_GENRES;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View className="border-line flex-row gap-3 border-t px-5 pt-3">
          <View className="flex-1">
            <Button label="Reset" variant="secondary" onPress={() => setDraft({ ...DEFAULT_FILTERS, sort: draft.sort })} />
          </View>
          <View className="flex-[2]">
            <Button
              label="Show results"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        <GenreFilter
          genres={names}
          selected={draft.genres}
          onToggle={(g) =>
            setDraft((d) => ({ ...d, genres: d.genres.includes(g) ? d.genres.filter((x) => x !== g) : [...d.genres, g] }))
          }
        />
        <YearFilter year={draft.year} onChange={(year) => patch({ year })} />
        <MonthFilter month={draft.month} onChange={(month) => patch({ month })} />
        <SeasonFilter season={draft.season} onChange={(season) => patch({ season })} />
        <OptionFilter title="Status" options={STATUS_OPTIONS} value={draft.status} onChange={(status) => patch({ status })} />
        <OptionFilter title="Type" options={TYPE_OPTIONS} value={draft.type} onChange={(type) => patch({ type })} />
        <OptionFilter title="Rating" options={RATING_OPTIONS} value={draft.minRating} onChange={(minRating) => patch({ minRating })} />
        {hideSort ? null : <SortSelector sort={draft.sort} onChange={(sort) => patch({ sort })} />}
      </ScrollView>
    </BottomSheet>
  );
}

/** Standalone sort picker sheet (used by the Sort button). */
export function SortSheet({ visible, value, onClose, onChange }: { visible: boolean; value: Filters["sort"]; onClose: () => void; onChange: (s: Filters["sort"]) => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort" heightRatio={0.55}>
      <View className="pb-3">
        <SortSelector
          sort={value}
          onChange={(s) => {
            onChange(s);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}
