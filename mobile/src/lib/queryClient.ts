import { onlineManager, QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";
import { ApiError } from "./api";
import { AsyncStorage } from "./storage";

/**
 * - `offlineFirst`: cached data renders immediately and a failed refresh keeps it.
 * - Identical in-flight requests are deduplicated by TanStack Query automatically.
 * - The cache is persisted to AsyncStorage so the app launches with content while offline.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      staleTime: 2 * 60 * 1000,
      gcTime: 7 * 24 * 3600 * 1000,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
      refetchOnWindowFocus: false,
    },
    mutations: { networkMode: "offlineFirst" },
  },
});

export const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "animedelta.query-cache", throttleTime: 3000 });

export function watchConnectivity(setOnline: (v: boolean) => void): () => void {
  onlineManager.setEventListener((setOnlineManager) =>
    NetInfo.addEventListener((s) => {
      const online = s.isConnected !== false && s.isInternetReachable !== false;
      setOnlineManager(online);
      setOnline(online);
    }),
  );
  return () => {};
}
