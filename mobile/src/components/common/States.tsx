import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { errorMessage } from "@/lib/api";
import { useUi } from "@/store/ui";
import { Button } from "./Button";

type IconName = keyof typeof Ionicons.glyphMap;

export function EmptyState({
  icon = "film-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="bg-surface2 mb-4 h-16 w-16 items-center justify-center rounded-full">
        <Ionicons name={icon} size={30} color="#8b5cf6" />
      </View>
      <Text className="text-fg text-center text-lg font-bold">{title}</Text>
      {message ? <Text className="text-muted mt-1 text-center text-sm">{message}</Text> : null}
      {actionLabel ? (
        <View className="mt-5">
          <Button label={actionLabel} onPress={onAction} compact />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ error, onRetry, title = "Unable to load anime" }: { error?: unknown; onRetry?: () => void; title?: string }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={title}
      message={error ? errorMessage(error) : "Something went wrong"}
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
    />
  );
}

export function OfflineBanner() {
  const online = useUi((s) => s.online);
  if (online) return null;
  return (
    <View accessibilityRole="alert" className="mx-4 mb-3 flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3">
      <Ionicons name="cloud-offline-outline" size={20} color="#38bdf8" />
      <View className="flex-1">
        <Text className="text-fg text-sm font-bold">You&apos;re offline.</Text>
        <Text className="text-muted text-xs">Cached anime information is available. Streaming requires an internet connection.</Text>
      </View>
    </View>
  );
}
