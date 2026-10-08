import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Switch, Text, View, Pressable } from "react-native";
import { Header } from "@/components/navigation/Header";
import { Preferences, PrefRow } from "@/components/profile/Preferences";
import { pushPrefs, registerForPush } from "@/lib/notifications";
import { usePrefs } from "@/store/prefs";
import { toast } from "@/store/ui";

function Title({ children }: { children: string }) {
  return <Text className="text-muted mt-6 mb-2 px-1 text-xs font-bold tracking-wider uppercase">{children}</Text>;
}

export default function Settings() {
  const router = useRouter();
  const p = usePrefs();

  const update = async (patch: Partial<Pick<typeof p, "notifyEpisodes" | "notifyNewAnime" | "notifyRecommendations">>) => {
    const next = { ...p, ...patch };
    p.set(patch);
    if (Object.values(patch).some(Boolean) && !(await registerForPush())) {
      toast("Notifications aren't available on this device", "info");
    }
    pushPrefs({ newEpisodes: next.notifyEpisodes, newAnime: next.notifyNewAnime, recommendations: next.notifyRecommendations }).catch(() => toast("Couldn't save notification settings", "error"));
  };

  return (
    <View className="flex-1">
      <Header title="Settings" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        <Title>Preferences</Title>
        <Preferences />

        <Title>Notifications</Title>
        <View className="bg-surface border-line rounded-3xl border px-4">
          <PrefRow label="New Episodes">
            <Switch value={p.notifyEpisodes} onValueChange={(v) => update({ notifyEpisodes: v })} trackColor={{ true: "#e11d48" }} accessibilityLabel="New episodes notifications" />
          </PrefRow>
          <PrefRow label="New Anime">
            <Switch value={p.notifyNewAnime} onValueChange={(v) => update({ notifyNewAnime: v })} trackColor={{ true: "#e11d48" }} accessibilityLabel="New anime notifications" />
          </PrefRow>
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-fg flex-1 text-[15px]">Recommendations</Text>
            <Switch value={p.notifyRecommendations} onValueChange={(v) => update({ notifyRecommendations: v })} trackColor={{ true: "#e11d48" }} accessibilityLabel="Recommendation notifications" />
          </View>
        </View>
        <Text className="text-muted mt-2 px-1 text-xs">We only notify for anime on your list, at most once per release.</Text>

        <Title>About</Title>
        <View className="bg-surface border-line rounded-3xl border px-4">
          {[
            { label: "About AnimeDelta", to: "/about" },
            { label: "Privacy", to: "/privacy" },
          ].map((r, i) => (
            <Pressable key={r.to} accessibilityRole="link" onPress={() => router.push(r.to)} className={`flex-row items-center justify-between py-3.5 ${i === 0 ? "border-line border-b" : ""}`}>
              <Text className="text-fg text-[15px]">{r.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#a79ba8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
