import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Credentials go to the OS keystore. Web has no SecureStore, so it falls back to AsyncStorage. */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return Platform.OS === "web" ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") await AsyncStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* storage unavailable; the session simply won't persist */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") await AsyncStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};

export { AsyncStorage };
