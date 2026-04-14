import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { colors } from '../utils/theme';
import type { AuthStackParamList, HealthRecordsStackParamList, MainTabParamList } from './types';

enableScreens();

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const HealthStack = createNativeStackNavigator<HealthRecordsStackParamList>();

function AuthNavigator({ onSignIn }: { onSignIn: () => void }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {() => <LoginScreen onSimulateLogin={onSignIn} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function HealthRecordsNavigator() {
  return (
    <HealthStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <HealthStack.Screen component={VaccineScreen} name="Vaccine" options={{ title: 'Vacinas' }} />
      <HealthStack.Screen
        component={DewormingScreen}
        name="Deworming"
        options={{ title: 'Vermifugações' }}
      />
      <HealthStack.Screen
        component={MedicationScreen}
        name="Medication"
        options={{ title: 'Medicações' }}
      />
    </HealthStack.Navigator>
  );
}

function MainNavigator({ onSignOut }: { onSignOut: () => void }) {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <MainTabs.Screen name="Home" options={{ title: 'Home' }}>
        {() => <HomeScreen onSimulateLogout={onSignOut} />}
      </MainTabs.Screen>
      <MainTabs.Screen component={PetRegistrationScreen} name="Pets" options={{ title: 'Pets' }} />
      <MainTabs.Screen
        component={HealthRecordsNavigator}
        name="Health"
        options={{ title: 'Saúde' }}
      />
    </MainTabs.Navigator>
  );
}

export function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthNavigator onSignIn={() => setIsAuthenticated(true)} />;
  }

  return <MainNavigator onSignOut={() => setIsAuthenticated(false)} />;
}
