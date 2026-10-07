import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useUi } from "@/store/ui";

export function Toast() {
  const msg = useUi((s) => s.toast);
  const insets = useSafeAreaInsets();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(msg ? 1 : 0, { duration: 220 });
  }, [msg, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 24 }] }));
  const icon = msg?.kind === "success" ? "checkmark-circle" : msg?.kind === "error" ? "alert-circle" : "information-circle";
  const color = msg?.kind === "success" ? "#34d399" : msg?.kind === "error" ? "#f43f5e" : "#38bdf8";
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 84, alignItems: "center", zIndex: 100 }, style]}
    >
      {msg ? (
        <Animated.View className="bg-surface2 border-line max-w-md flex-row items-center gap-2 rounded-full border px-4 py-3">
          <Ionicons name={icon} size={18} color={color} />
          <Text className="text-fg text-sm font-medium">{msg.text}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
