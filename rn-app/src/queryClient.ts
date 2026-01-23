import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryClient,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  PersistQueryClientProviderProps,
  persistQueryClient,
} from "@tanstack/react-query-persist-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "fittracker-react-query-cache",
});

export async function setupReactQueryPersistence() {
  await persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24,
  });
}

export const persistOptions: PersistQueryClientProviderProps["persistOptions"] = {
  persister,
  maxAge: 1000 * 60 * 60 * 24,
};

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    focusManager.setFocused(state === "active");
  });
}

onlineManager.setOnline(true);
