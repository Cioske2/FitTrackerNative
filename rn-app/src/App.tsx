import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const init = useAuthStore(s => s.init);
  const loading = useAuthStore(s => s.loading);

  useEffect(() => { init(); }, [init]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
