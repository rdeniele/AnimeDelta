import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Standard screen header with safe-area padding, optional back button and right slot. */
export function Header({ title, back, right, subtitle }: { title: string; back?: boolean; right?: ReactNode; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-3">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          className="bg-surface2 h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#a99fc4" />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text accessibilityRole="header" numberOfLines={1} className="text-fg text-2xl font-extrabold">
          {title}
        </Text>
        {subtitle ? <Text className="text-muted text-xs">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
