import { Pressable, Switch, Text, View } from "react-native";
import { usePrefs, type QualityPref, type ThemePref } from "@/store/prefs";

function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="bg-surface2 flex-row rounded-full p-1">
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 ${value === o.value ? "bg-primary" : ""}`}
        >
          <Text className={`text-[13px] font-semibold ${value === o.value ? "text-white" : "text-muted"}`}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PrefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="border-line flex-row items-center justify-between gap-3 border-b py-3">
      <Text className="text-fg flex-1 text-[15px]">{label}</Text>
      {children}
    </View>
  );
}

/** Subtitle language, autoplay, quality and theme. Persisted locally. */
export function Preferences() {
  const p = usePrefs();
  return (
    <View className="bg-surface border-line rounded-3xl border px-4">
      <PrefRow label="Subtitle Language">
        <Segmented
          label="Subtitle language"
          value={p.subtitleLang}
          onChange={(v) => p.set({ subtitleLang: v })}
          options={[
            { value: "off", label: "Off" },
            { value: "en", label: "English" },
            { value: "ja", label: "日本語" },
          ]}
        />
      </PrefRow>
      <PrefRow label="Autoplay next episode">
        <Switch value={p.autoplayNext} onValueChange={(v) => p.set({ autoplayNext: v })} trackColor={{ true: "#8b5cf6" }} accessibilityLabel="Autoplay next episode" />
      </PrefRow>
      <PrefRow label="Video Quality">
        <Segmented<QualityPref>
          label="Video quality"
          value={p.quality}
          onChange={(v) => p.set({ quality: v })}
          options={[
            { value: "auto", label: "Auto" },
            { value: "high", label: "High" },
            { value: "low", label: "Low" },
          ]}
        />
      </PrefRow>
      <View className="flex-row items-center justify-between gap-3 py-3">
        <Text className="text-fg flex-1 text-[15px]">Theme</Text>
        <Segmented<ThemePref>
          label="Theme"
          value={p.theme}
          onChange={(v) => p.set({ theme: v })}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "system", label: "System" },
          ]}
        />
      </View>
    </View>
  );
}
