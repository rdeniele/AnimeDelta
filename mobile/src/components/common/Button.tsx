import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

export function Button({
  label,
  icon,
  onPress,
  variant = "primary",
  compact,
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  compact?: boolean;
  disabled?: boolean;
}) {
  const bg = { primary: "bg-primary", secondary: "bg-surface2", ghost: "bg-transparent", danger: "bg-danger" }[variant];
  const text = variant === "secondary" || variant === "ghost" ? "text-fg" : "text-white";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`${bg} flex-row items-center justify-center gap-2 rounded-full active:opacity-80 ${compact ? "px-4 py-2" : "px-5 py-3"} ${disabled ? "opacity-50" : ""}`}
    >
      {icon ? <Ionicons name={icon} size={compact ? 16 : 20} color={variant === "secondary" || variant === "ghost" ? undefined : "#fff"} /> : null}
      <Text className={`${text} font-semibold ${compact ? "text-sm" : "text-base"}`}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 22,
  color = "#fff",
  filled,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      className={`h-11 w-11 items-center justify-center rounded-full active:opacity-70 ${filled ? "bg-black/50" : ""}`}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  onRemove,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={onRemove ? `Remove filter ${label}` : label}
      onPress={onRemove ?? onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-80 ${
        active ? "border-primary bg-primary" : "border-line bg-surface"
      }`}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? "#fff" : "#a99fc4"} /> : null}
      <Text className={`text-sm font-medium ${active ? "text-white" : "text-fg"}`}>{label}</Text>
      {onRemove ? <Ionicons name="close" size={14} color="#fff" /> : null}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Text accessibilityRole="header" className="text-fg text-xl font-bold">
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="link">
          <Text className="text-accent text-sm font-semibold">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, height = 4 }: { value: number; height?: number }) {
  return (
    <View className="bg-white/20 overflow-hidden rounded-full" style={{ height }}>
      <View className="bg-primary h-full rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
    </View>
  );
}
