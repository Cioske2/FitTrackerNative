import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import EditDiaryEntryModal from '../screens/Diary/EditDiaryEntryModal';
import MealAnalysisScreen from '../screens/Diary/MealAnalysisScreen';
import BarcodeScannerScreen from '../screens/Diary/BarcodeScannerScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => !!s.session);
  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      )}
  <Stack.Screen name="EditDiaryEntry" component={EditDiaryEntryModal} options={{ presentation:'modal', title:'Modifica Voce' }} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ presentation:'fullScreenModal', title:'Scanner' }} />
  <Stack.Screen name="MealAnalysis" component={MealAnalysisScreen} options={{ presentation:'modal', title:'Analisi Pasto' }} />
    </Stack.Navigator>
  );
}
