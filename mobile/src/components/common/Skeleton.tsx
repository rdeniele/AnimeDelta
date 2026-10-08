import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View, type DimensionValue, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

/** Shimmering placeholder block. Runs on the UI thread. */
export function Skeleton({ width = "100%", height = 16, radius = 12, style }: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}) {
  const [w, setW] = useState(0);
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * w }] }));
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      className="bg-surface2 overflow-hidden"
      style={[{ width, height, borderRadius: radius }, style]}
      accessibilityElementsHidden
    >
      <Animated.View style={[{ width: "100%", height: "100%" }, anim]}>
        <LinearGradient
          colors={["transparent", "rgba(225,29,72,0.14)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function PosterSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width }}>
      <Skeleton height={width * 1.5} radius={14} />
      <Skeleton height={12} width="80%" style={{ marginTop: 8 }} />
    </View>
  );
}

export function RailSkeleton({ cardWidth = 120, count = 6 }: { cardWidth?: number; count?: number }) {
  return (
    <View className="flex-row gap-3 px-4">
      {Array.from({ length: count }, (_, i) => (
        <PosterSkeleton key={i} width={cardWidth} />
      ))}
    </View>
  );
}

export function GridSkeleton({ columns, cardWidth, rows = 3 }: { columns: number; cardWidth: number; rows?: number }) {
  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {Array.from({ length: columns * rows }, (_, i) => (
        <PosterSkeleton key={i} width={cardWidth} />
      ))}
    </View>
  );
}
