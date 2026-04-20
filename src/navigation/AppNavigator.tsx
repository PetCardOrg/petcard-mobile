import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetDetailsScreen } from '../screens/Home/PetDetailsScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { colors } from '../utils/theme';
import type {
  AuthStackParamList,
  HealthRecordsStackParamList,
  HomeStackParamList,
  MainTabParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MainTabs = createMaterialTopTabNavigator<MainTabParamList>();
const HealthStack = createNativeStackNavigator<HealthRecordsStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={LoginScreen} name="Login" />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <HomeStack.Screen component={HomeScreen} name="HomeList" options={{ headerShown: false }} />
      <HomeStack.Screen
        component={PetDetailsScreen}
        name="PetDetails"
        options={({ route }) => ({ title: route.params.petName })}
      />
    </HomeStack.Navigator>
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
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'none',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primaryDark,
          height: 2,
          top: 0,
        },
        tabBarShowIcon: true,
      }}
    >
      <MainTabs.Screen
        component={HomeNavigator}
        name="Home"
        options={({ route }) => ({
          title: 'Home',
          swipeEnabled: getFocusedRouteNameFromRoute(route) !== 'PetDetails',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="home-outline" size={22} />,
        })}
      />
      <MainTabs.Screen
        component={PetRegistrationScreen}
        name="Pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="paw-outline" size={22} />,
        }}
      />
      <MainTabs.Screen
        component={HealthRecordsNavigator}
        name="Health"
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route);
          return {
            title: 'Saúde',
            swipeEnabled: !focused || focused === 'Vaccine',
            tabBarIcon: ({ color }) => <Ionicons color={color} name="heart-outline" size={22} />,
          };
        }}
      />
      <MainTabs.Screen
        component={ProfileScreen}
        name="Profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="person-outline" size={22} />,
        }}
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
