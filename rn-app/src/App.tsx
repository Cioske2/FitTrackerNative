import "react-native-url-polyfill/auto";
import "react-native-reanimated";
import React, { useEffect, useCallback } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { Platform, AppState } from "react-native";
// expo-navigation-bar provides control over the Android navigation bar appearance.
// Ensure to add it to dependencies: expo install expo-navigation-bar
// Using dynamic import fallback to avoid runtime crash if not installed yet.
let NavigationBar: any = null;
try {
  NavigationBar = require("expo-navigation-bar");
} catch {}
import RootNavigator from "./navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "./store/authStore";
import { ActivityIndicator, View } from "react-native";
import { colors } from "./theme/colors";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persistOptions } from "./queryClient";
import { supabase } from "./services/supabaseClient";
import { syncOfflineQueue } from "./services/offlineSyncService";
import * as Sentry from "sentry-expo";
import Constants from "expo-constants";
import { initAnalytics } from "./services/analyticsService";

const extra = Constants.expoConfig?.extra || {};
const sentryEnabled = !!extra.SENTRY_DSN && extra.SENTRY_ENABLED !== "false";
if (sentryEnabled) {
  Sentry.init({
    dsn: extra.SENTRY_DSN,
    enableInExpoDevelopment: false,
    debug: false,
  });
}
initAnalytics();

export default function App() {
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    init();
  }, [init]);

  const hideSystemNav = useCallback(async () => {
    if (Platform.OS === "android" && NavigationBar) {
      try {
        // Su SDK 54+ edge-to-edge, alcuni metodi possono generare warning o errori se chiamati simultaneamente
        await NavigationBar.setBehaviorAsync("immersive");
        await NavigationBar.setVisibilityAsync("hidden");
      } catch (e) {
        console.warn("NavigationBar error:", e);
      }
    }
  }, []);

  // Prima esecuzione all'avvio
  useEffect(() => {
    const timer = setTimeout(() => hideSystemNav(), 500);
    return () => clearTimeout(timer);
  }, [hideSystemNav]);

  // Ogni volta che lo stato dell'app torna active
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => hideSystemNav(), 500);
        syncOfflineQueue();
      }
    });
    return () => sub.remove();
  }, [hideSystemNav]);

  useEffect(() => {
    syncOfflineQueue();
  }, []);

  useEffect(() => {
    if (!user) return;
    const diaryChannel = supabase
      .channel("realtime:diary_entries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "diary_entries" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
          queryClient.invalidateQueries({ queryKey: ["diaryHistory"] });
        },
      )
      .subscribe();

    const workoutsChannel = supabase
      .channel("realtime:workouts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workouts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["workouts"] });
        },
      )
      .subscribe();

    const compositeChannel = supabase
      .channel("realtime:composite_meals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "composite_meals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["compositeMeals"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(diaryChannel);
      supabase.removeChannel(workoutsChannel);
      supabase.removeChannel(compositeChannel);
    };
  }, [user]);

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.background,
      primary: colors.accent,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
  } as const;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#000",
              }}
            >
              <ActivityIndicator color="#38bdf8" />
            </View>
          ) : (
            <RootNavigator />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
