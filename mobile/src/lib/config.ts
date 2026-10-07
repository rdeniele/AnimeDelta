import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Backend base URL. Set EXPO_PUBLIC_API_URL for deployed builds (public vars only; the app
 * never holds database or provider secrets). In development we derive the dev machine's
 * address from the Expo host so physical devices on the same network just work.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host && Platform.OS !== "web") return `http://${host}:4000`;
  return "http://localhost:4000";
}

export const API_URL = resolveApiUrl();
