import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimeRail } from "@/components/anime/AnimeRail";
import { Button } from "@/components/common/Button";
import { Header } from "@/components/navigation/Header";
import { Preferences } from "@/components/profile/Preferences";
import { useHome, useMyList } from "@/hooks/queries";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { toast } from "@/store/ui";

function LinkRow({ icon, label, detail, to }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; to: string }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(to)} className="flex-row items-center gap-3 py-3.5 active:opacity-60">
      <Ionicons name={icon} size={22} color="#e11d48" />
      <Text className="text-fg flex-1 text-base font-medium">{label}</Text>
      {detail ? <Text className="text-muted text-sm">{detail}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#a79ba8" />
    </Pressable>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const username = useAuth((s) => s.username);
  const setUsername = useAuth((s) => s.setUsername);
  const home = useHome();
  const list = useMyList();
  const recent = usePrefs((s) => s.recentlyViewed);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(username);

  const saveName = async () => {
    const v = draft.trim().slice(0, 30);
    if (!v) return;
    setEditing(false);
    await setUsername(v);
    api("/auth/me", { method: "PATCH", body: { username: v } }).catch(() => toast("Saved locally; couldn't reach server", "info"));
  };

  return (
    <View className="flex-1">
      <Header title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View className="items-center px-4 pb-6">
          <View className="bg-primary h-24 w-24 items-center justify-center rounded-full">
            <Text className="text-4xl font-extrabold text-white">{username.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit username"
            onPress={() => {
              setDraft(username);
              setEditing(true);
            }}
            className="mt-3 flex-row items-center gap-2 active:opacity-60"
          >
            <Text className="text-fg text-xl font-bold">{username}</Text>
            <Ionicons name="pencil" size={14} color="#a79ba8" />
          </Pressable>
        </View>

        <AnimeRail kind="continue" title="Continue Watching" items={home.data?.continueWatching ?? []} />

        <View className="bg-surface border-line mx-4 mb-7 rounded-3xl border px-4">
          <LinkRow icon="bookmark-outline" label="My List" detail={list.data ? String(list.data.length) : undefined} to="/my-list" />
          <View className="border-line border-t" />
          <LinkRow icon="time-outline" label="History" to="/history" />
          <View className="border-line border-t" />
          <LinkRow icon="sparkles-outline" label="New Anime & Calendar" to="/new-anime" />
          <View className="border-line border-t" />
          <LinkRow icon="settings-outline" label="Settings & Notifications" to="/settings" />
        </View>

        <AnimeRail kind="poster" title="Recently Viewed" items={recent} />

        <Text className="text-fg mb-3 px-4 text-xl font-bold">Preferences</Text>
        <View className="mx-4">
          <Preferences />
        </View>

        <View className="bg-surface border-line mx-4 mt-7 rounded-3xl border px-4">
          <LinkRow icon="information-circle-outline" label="About" to="/about" />
          <View className="border-line border-t" />
          <LinkRow icon="shield-checkmark-outline" label="Privacy" to="/privacy" />
        </View>
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View className="flex-1 items-center justify-center bg-black/70 px-8">
          <View className="bg-surface border-line w-full max-w-sm rounded-3xl border p-5">
            <Text className="text-fg mb-3 text-lg font-bold">Username</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              maxLength={30}
              onSubmitEditing={saveName}
              accessibilityLabel="Username"
              className="bg-surface2 text-fg rounded-xl px-4 py-3 text-base"
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Button label="Cancel" variant="ghost" compact onPress={() => setEditing(false)} />
              <Button label="Save" compact onPress={saveName} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
