import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import FoodDiaryScreen from '../screens/Diary/FoodDiaryScreen';
import WorkoutScreen from '../screens/Workouts/WorkoutScreen';
import ProgressChartsScreen from '../screens/Progress/ProgressChartsScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import FoodAdminScreen from '../screens/Admin/FoodAdminScreen';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const isAdmin = useAuthStore(s => s.user?.role === 'admin');
  return (
    <Tab.Navigator screenOptions={{
      headerShown:false,
      tabBarShowLabel:false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle:{
        backgroundColor: colors.background,
        borderTopColor: '#0d1519',
        height:68,
        paddingTop:8,
        paddingBottom:14
      }
    }}>
  <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="home" color={color} size={size}/> }} />
  <Tab.Screen name="Diary" component={FoodDiaryScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="fast-food" color={color} size={size}/> }} />
    <Tab.Screen name="Workouts" component={WorkoutScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="barbell" color={color} size={size}/> }} />
  <Tab.Screen name="Progress" component={ProgressChartsScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="stats-chart" color={color} size={size}/> }} />
  <Tab.Screen name="Goals" component={GoalsScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="flag" color={color} size={size}/> }} />
  {isAdmin && <Tab.Screen name="Admin" component={FoodAdminScreen} options={{ tabBarIcon:({color, size}: {color: string; size: number}) => <Ionicons name="construct" color={color} size={size}/> }} />}
    </Tab.Navigator>
  );
}
