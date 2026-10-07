import { create } from "zustand";
import type { AnimeCard } from "@/types";

export interface ToastMsg {
  id: number;
  text: string;
  kind: "info" | "success" | "error";
}

interface UiState {
  toast: ToastMsg | null;
  showToast: (text: string, kind?: ToastMsg["kind"]) => void;
  hideToast: (id: number) => void;
  /** Anime whose "add to list / change status" sheet is open. */
  listSheet: AnimeCard | null;
  openListSheet: (a: AnimeCard | null) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
}

let nextId = 1;

export const useUi = create<UiState>((set, get) => ({
  toast: null,
  showToast: (text, kind = "info") => {
    const id = nextId++;
    set({ toast: { id, text, kind } });
    setTimeout(() => get().hideToast(id), 2600);
  },
  hideToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : s)),
  listSheet: null,
  openListSheet: (a) => set({ listSheet: a }),
  online: true,
  setOnline: (online) => set({ online }),
}));

export const toast = (text: string, kind?: ToastMsg["kind"]) => useUi.getState().showToast(text, kind);
