import "@/global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Appearance, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ListStatusSheet } from "@/components/anime/ListStatusSheet";
import { Toast } from "@/components/common/Toast";
import { ensureSession } from "@/lib/api";
import { persister, queryClient, watchConnectivity } from "@/lib/queryClient";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { useUi } from "@/store/ui";

void SplashScreen.preventAutoHideAsync();

/** Splash → load cached data & prefs → check authentication → app. */
function useBootstrap() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    watchConnectivity(useUi.getState().setOnline);
    (async () => {
      await useAuth.getState().load();
      // Never block launch on the network: a slow or unreachable API falls back to cached content.
      await Promise.race([ensureSession().catch(() => {}), new Promise((r) => setTimeout(r, 3500))]);
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, []);
  return ready;
}

function useApplyTheme() {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    // react-native-web has no setColorScheme; the OS scheme applies there.
    Appearance.setColorScheme?.(theme === "system" ? "unspecified" : theme);
  }, [theme]);
}

export default function RootLayout() {
  const ready = useBootstrap();
  useApplyTheme();
  const scheme = useColorScheme();
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 7 * 24 * 3600 * 1000,
            dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === "success" && q.queryKey[0] !== "playback" },
          }}
        >
          <View className="bg-bg flex-1">
            <StatusBar style={scheme === "light" ? "dark" : "light"} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: scheme === "light" ? "#f7f4ff" : "#0a0612" }, animation: "slide_from_right" }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="player/[animeId]/[episodeId]" options={{ animation: "fade", orientation: "all", gestureEnabled: false }} />
            </Stack>
            <Toast />
            <ListStatusSheet />
          </View>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
