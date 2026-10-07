import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

/**
 * Registers this device for push and sends the token to the backend. Delivery is done server-side
 * (Expo push service) when a followed anime gets a new episode; the backend only stores tokens
 * and per-category preferences. Returns false if unavailable (web, Expo Go on Android, denied).
 */
export async function registerForPush(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await api("/notifications/token", { method: "POST", body: { token, platform: Platform.OS === "ios" ? "ios" : "android" } });
    return true;
  } catch {
    return false;
  }
}

export function pushPrefs(body: { newEpisodes: boolean; newAnime: boolean; recommendations: boolean }) {
  return api("/notifications/prefs", { method: "PUT", body });
}
