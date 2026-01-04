import { create } from "zustand";

interface AppState {
  currentService: string | null;
  isListening: boolean;
  setCurrentService: (service: string | null) => void;
  setIsListening: (listening: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentService: null,
  isListening: false,
  setCurrentService: (service) => set({ currentService: service }),
  setIsListening: (listening) => set({ isListening: listening }),
}));
