import { Image } from "expo-image";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

/** Cached, lazily-decoded artwork with a placeholder surface. */
export function Art({
  uri,
  style,
  radius = 0,
  priority = "normal",
  fit = "cover",
  className = "",
}: {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  priority?: "low" | "normal" | "high";
  fit?: "cover" | "contain";
  className?: string;
}) {
  return (
    <View className={`bg-surface2 overflow-hidden ${className}`} style={[{ borderRadius: radius }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit={fit}
          transition={220}
          cachePolicy="memory-disk"
          priority={priority}
          recyclingKey={uri}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}
