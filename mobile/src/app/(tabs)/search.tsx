import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Chip } from "@/components/common/Button";
import { EmptyState, ErrorState, OfflineBanner } from "@/components/common/States";
import { useBrowse, usePopularSearches } from "@/hooks/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";

export default function Search() {
  const insets = useSafeAreaInsets();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const query = useDebounce(text.trim(), 300);
  const history = usePrefs((s) => s.searchHistory);
  const addSearch = usePrefs((s) => s.addSearch);
  const clearSearches = usePrefs((s) => s.clearSearches);
  const hasSession = Boolean(useAuth((s) => s.token));
  const popular = usePopularSearches();

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => input.current?.focus(), 150);
      return () => clearTimeout(t);
    }, []),
  );

  const results = useBrowse(DEFAULT_FILTERS, query, query.length > 0);
  const items = useMemo(() => results.data?.pages.flatMap((p) => p.items) ?? [], [results.data]);

  const commit = (q: string) => {
    const v = q.trim();
    if (!v) return;
    addSearch(v);
    if (hasSession) void api("/search/history", { method: "POST", body: { query: v } }).catch(() => {});
  };
  const pick = (q: string) => {
    setText(q);
    commit(q);
    Keyboard.dismiss();
  };

  const suggestions = (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
      <OfflineBanner />
      {history.length ? (
        <View className="mb-6 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-fg text-lg font-bold">Recent Searches</Text>
            <Pressable onPress={clearSearches} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search history">
              <Text className="text-accent text-sm font-semibold">Clear</Text>
            </Pressable>
          </View>
          {history.map((h) => (
            <Pressable key={h} onPress={() => pick(h)} className="flex-row items-center gap-3 py-2.5 active:opacity-60">
              <Ionicons name="time-outline" size={18} color="#a99fc4" />
              <Text className="text-fg flex-1 text-base">{h}</Text>
              <Ionicons name="arrow-up-outline" size={16} color="#a99fc4" style={{ transform: [{ rotate: "-45deg" }] }} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <View className="px-4">
        <Text className="text-fg mb-3 text-lg font-bold">Popular Searches</Text>
        <View className="flex-row flex-wrap gap-2">
          {(popular.data ?? ["Starlit Blade", "Neon Ronin", "Moonlit Café", "Aether Academy"]).map((p) => (
            <Chip key={p} label={p} icon="trending-up" onPress={() => pick(p)} />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View className="flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="bg-surface border-line mx-4 mb-4 flex-row items-center gap-3 rounded-2xl border px-4">
        <Ionicons name="search" size={18} color="#a99fc4" />
        <TextInput
          ref={input}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => commit(text)}
          placeholder="Search anime..."
          placeholderTextColor="#a99fc4"
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search anime"
          className="text-fg flex-1 py-3.5 text-base"
          style={{ outlineStyle: "none" } as object}
        />
        {text ? (
          <Pressable onPress={() => setText("")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear text">
            <Ionicons name="close-circle" size={20} color="#a99fc4" />
          </Pressable>
        ) : null}
      </View>

      {!query ? (
        suggestions
      ) : results.isError && !results.data ? (
        <ErrorState error={results.error} onRetry={() => results.refetch()} />
      ) : (
        <AnimeGrid
          items={items}
          loading={results.isLoading}
          fetchingMore={results.isFetchingNextPage}
          onEnd={() => results.hasNextPage && !results.isFetchingNextPage && results.fetchNextPage()}
          header={
            results.data ? (
              <Text className="text-muted mb-3 px-4 text-sm">
                {results.data.pages[0].total} result{results.data.pages[0].total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
              </Text>
            ) : null
          }
          empty={<EmptyState icon="search-outline" title="No results" message="Try a different title, studio, genre or year." />}
        />
      )}
    </View>
  );
}
