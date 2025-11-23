import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import EditDiaryEntryModal from '../screens/Diary/EditDiaryEntryModal';
import MealAnalysisScreen from '../screens/Diary/MealAnalysisScreen';
import BarcodeScannerScreen from '../screens/Diary/BarcodeScannerScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import WeeklyPlanScreen from '../screens/Workouts/WeeklyPlanScreen';
import ProgressPhotosScreen from '../screens/Profile/ProgressPhotosScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => !!s.session);
  const user = useAuthStore(s => s.user);
  const needsOnboarding = isAuthenticated && user?.user_metadata && !user.user_metadata.onboarded;

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      )}
      <Stack.Screen name="EditDiaryEntry" component={EditDiaryEntryModal} options={{ presentation: 'modal', title: 'Modifica Voce' }} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ presentation: 'fullScreenModal', title: 'Scanner' }} />
      <Stack.Screen name="MealAnalysis" component={MealAnalysisScreen} options={{ presentation: 'modal', title: 'Analisi Pasto' }} />
      <Stack.Screen name="WeeklyPlan" component={WeeklyPlanScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProgressPhotos" component={ProgressPhotosScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Goals" component={GoalsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
