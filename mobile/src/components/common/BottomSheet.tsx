import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

/**
 * Lightweight bottom sheet: backdrop fade + slide-up, dismissed by backdrop tap or Android back.
 * Content scrolls itself; pass a ScrollView/FlatList as children when needed.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  heightRatio = 0.85,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  heightRatio?: number;
  footer?: ReactNode;
}) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const t = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      t.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      return;
    }
    t.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
    // Unmount after the exit animation (timer-based so it also works on web).
    const id = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(id);
  }, [visible, t]);

  const backdrop = useAnimatedStyle(() => ({ opacity: t.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - t.value) * height }] }));
  const maxH = Math.min(height * heightRatio, 760);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent supportedOrientations={["portrait", "landscape"]}>
      <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }, backdrop]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[{ width: Math.min(width, 640), maxHeight: maxH, paddingBottom: Math.max(insets.bottom, 12) }, sheet]}
          className="bg-surface border-line overflow-hidden rounded-t-3xl border-t"
        >
          <View className="items-center pt-2.5 pb-1">
            <View className="bg-line h-1 w-10 rounded-full" />
          </View>
          {title ? <Text className="text-fg px-5 pt-2 pb-3 text-lg font-bold">{title}</Text> : null}
          <View style={{ flexShrink: 1 }}>{children}</View>
          {footer}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 px-8">
        <View className="bg-surface border-line w-full max-w-sm rounded-3xl border p-5">
          <Text className="text-fg text-lg font-bold">{title}</Text>
          <Text className="text-muted mt-2 text-sm">{message}</Text>
          <View className="mt-5 flex-row justify-end gap-3">
            <Pressable onPress={onCancel} accessibilityRole="button" className="rounded-full px-4 py-2.5 active:opacity-70">
              <Text className="text-fg font-semibold">Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} accessibilityRole="button" className="bg-danger rounded-full px-4 py-2.5 active:opacity-80">
              <Text className="font-semibold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
