import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  driverOnline: boolean;
  mapStyle: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setDriverOnline: (online: boolean) => void;
  setMapStyle: (style: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  driverOnline: false,
  mapStyle: "mapbox://styles/mapbox/light-v11",
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setDriverOnline: (driverOnline) => set({ driverOnline }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
}));
