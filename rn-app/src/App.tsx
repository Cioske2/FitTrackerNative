import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';
// expo-navigation-bar provides control over the Android navigation bar appearance.
// Ensure to add it to dependencies: expo install expo-navigation-bar
// Using dynamic import fallback to avoid runtime crash if not installed yet.
let NavigationBar: any = null;
try { NavigationBar = require('expo-navigation-bar'); } catch {} 
import RootNavigator from './navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { colors } from './theme/colors';

export default function App() {
  const init = useAuthStore(s => s.init);
  const loading = useAuthStore(s => s.loading);

  useEffect(() => { init(); }, [init]);
  // Hide Android system navigation bar for immersive UI
  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar) {
      (async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#000000');
        } catch {}
      })();
    }
  }, []);

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.background,
      primary: colors.accent,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent
    }
  } as const;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        {loading ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
            <ActivityIndicator color="#38bdf8" />
          </View>
        ) : (
          <RootNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
