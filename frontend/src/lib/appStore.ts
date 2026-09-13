import { create } from "zustand";

import { AppStoreState } from "@/lib/types";
import { SelectedCatalog, defaultSelectedCatalogs } from "@shared/catalogs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useAppStore = create<AppStoreState>()((_set) => ({
  code: undefined,
  installLink: undefined,
  selectedCatalogs: defaultSelectedCatalogs,
}));

export const setSimklAuthCode = (code: string | undefined) =>
  useAppStore.setState({ code });

export const setInstallLink = (installLink: string | undefined) =>
  useAppStore.setState({ installLink });

export const setSelectedCatalogs = (selectedCatalogs: SelectedCatalog[]) =>
  useAppStore.setState({ selectedCatalogs });

export default useAppStore;
