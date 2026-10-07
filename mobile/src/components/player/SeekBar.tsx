import { useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

/** Touch-friendly scrubber: tap to jump, drag to scrub. Commits on release. */
export function SeekBar({
  position,
  duration,
  onScrub,
  onCommit,
}: {
  position: number;
  duration: number;
  onScrub?: (t: number) => void;
  onCommit: (t: number) => void;
}) {
  const width = useRef(1);
  const [drag, setDrag] = useState<number | null>(null);
  const toTime = (x: number) => Math.max(0, Math.min(1, x / width.current)) * duration;
  const shown = drag ?? position;
  const ratio = duration > 0 ? Math.min(1, shown / duration) : 0;

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      setDrag(toTime(e.x));
      onScrub?.(toTime(e.x));
    })
    .onUpdate((e) => {
      const t = toTime(e.x);
      setDrag(t);
      onScrub?.(t);
    })
    .onFinalize((e, success) => {
      if (success || e.state === 5) onCommit(toTime(e.x));
      setDrag(null);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Seek"
        accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shown) }}
        onLayout={(e) => (width.current = e.nativeEvent.layout.width || 1)}
        className="h-8 justify-center"
      >
        <View className="h-1 overflow-hidden rounded-full bg-white/25">
          <View className="bg-primary h-full" style={{ width: `${ratio * 100}%` }} />
        </View>
        <View
          className="bg-primary absolute h-3.5 w-3.5 rounded-full"
          style={{ left: `${ratio * 100}%`, marginLeft: -7, transform: [{ scale: drag != null ? 1.4 : 1 }] }}
        />
      </View>
    </GestureDetector>
  );
}
