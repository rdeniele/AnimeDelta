import { create } from "zustand";
import { secureStorage } from "@/lib/storage";

const TOKEN_KEY = "animedelta.token";
const USER_KEY = "animedelta.user";

interface AuthState {
  token: string | null;
  username: string;
  ready: boolean;
  load: () => Promise<void>;
  setSession: (token: string, username: string) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  username: "Otaku",
  ready: false,
  load: async () => {
    const [token, username] = await Promise.all([secureStorage.get(TOKEN_KEY), secureStorage.get(USER_KEY)]);
    set({ token, username: username ?? "Otaku", ready: true });
  },
  setSession: async (token, username) => {
    await Promise.all([secureStorage.set(TOKEN_KEY, token), secureStorage.set(USER_KEY, username)]);
    set({ token, username });
  },
  setUsername: async (username) => {
    await secureStorage.set(USER_KEY, username);
    set({ username });
  },
}));
