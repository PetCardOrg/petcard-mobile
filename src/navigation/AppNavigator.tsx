import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import { DigitalWalletScreen } from '../screens/DigitalWallet/DigitalWalletScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetDetailsScreen } from '../screens/Home/PetDetailsScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { colors, radii, spacing, typography } from '../utils/theme';
import type { AuthStackParamList, HomeStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MainTabs = createMaterialTopTabNavigator<MainTabParamList>();

const healthTabs = [
  { key: 'vaccines', label: 'Vacinas', icon: 'medkit-outline' as const, Screen: VaccineScreen },
  { key: 'dewormings', label: 'Vermífugos', icon: 'bug-outline' as const, Screen: DewormingScreen },
  {
    key: 'medications',
    label: 'Medicações',
    icon: 'bandage-outline' as const,
    Screen: MedicationScreen,
  },
];

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
      <HomeStack.Screen
        component={DigitalWalletScreen}
        name="DigitalWallet"
        options={{ title: 'Carteira Digital' }}
      />
    </HomeStack.Navigator>
  );
}

function HealthRecordsNavigator() {
  const [activeTab, setActiveTab] = useState(healthTabs[0].key);
  const ActiveScreen = healthTabs.find((t) => t.key === activeTab)!.Screen;
  const insets = useSafeAreaInsets();

  return (
    <View style={healthStyles.container}>
      <View style={[healthStyles.segmentedControl, { marginTop: insets.top + spacing.sm }]}>
        {healthTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[healthStyles.segment, isActive && healthStyles.segmentActive]}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? colors.white : colors.muted} />
              <Text style={[healthStyles.segmentText, isActive && healthStyles.segmentTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={healthStyles.content}>
        <ActiveScreen />
      </View>
    </View>
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
          swipeEnabled:
            getFocusedRouteNameFromRoute(route) !== 'PetDetails' &&
            getFocusedRouteNameFromRoute(route) !== 'DigitalWallet',
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
        options={{
          title: 'Saúde',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="heart-outline" size={22} />,
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

const healthStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: radii.md - 2,
  },
  segmentActive: {
    backgroundColor: colors.primaryDark,
  },
  segmentText: {
    ...typography.caption,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
});
