import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { colors } from '../utils/theme';
import type { AuthStackParamList, HealthRecordsStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const HealthStack = createNativeStackNavigator<HealthRecordsStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={LoginScreen} name="Login" />
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

function MainNavigator() {
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
      <MainTabs.Screen component={HomeScreen} name="Home" options={{ title: 'Home' }} />
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <MainNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
