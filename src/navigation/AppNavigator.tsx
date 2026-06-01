import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import { DigitalWalletScreen } from '../screens/DigitalWallet/DigitalWalletScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetDetailsScreen } from '../screens/Home/PetDetailsScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ClinicSearchScreen } from '../screens/ClinicSearch/ClinicSearchScreen';
import { AppointmentsScreen } from '../screens/Appointments/AppointmentsScreen';
import { colors, radii, spacing, typography } from '../utils/theme';
import type { AuthStackParamList, HomeStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MainTabs = createMaterialTopTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={LoginScreen} name="Login" />
      <AuthStack.Screen component={RegisterScreen} name="Register" />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  const { t } = useTranslation();

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
        options={{ title: t('digitalWallet.title') }}
      />
      <HomeStack.Screen
        component={PetRegistrationScreen}
        name="PetRegistration"
        options={{ title: t('petRegistration.title') }}
      />
    </HomeStack.Navigator>
  );
}

function HealthRecordsNavigator() {
  const { t } = useTranslation();
  const healthTabs = [
    {
      key: 'vaccines',
      label: t('healthRecords.tabs.vaccines'),
      icon: 'medkit-outline' as const,
      Screen: VaccineScreen,
    },
    {
      key: 'dewormings',
      label: t('healthRecords.tabs.dewormings'),
      icon: 'bug-outline' as const,
      Screen: DewormingScreen,
    },
    {
      key: 'medications',
      label: t('healthRecords.tabs.medications'),
      icon: 'bandage-outline' as const,
      Screen: MedicationScreen,
    },
  ];

  const [activeTab, setActiveTab] = useState(healthTabs[0].key);
  const ActiveScreen = healthTabs.find((tab) => tab.key === activeTab)!.Screen;
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
  const { t } = useTranslation();
  usePushNotifications();

  return (
    <MainTabs.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'none',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 80 : 64,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primaryDark,
          height: 2,
          top: 0,
        },
        tabBarShowIcon: true,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <MainTabs.Screen
        component={HomeNavigator}
        name="Home"
        options={({ route }) => ({
          title: t('tabs.home'),
          swipeEnabled:
            getFocusedRouteNameFromRoute(route) !== 'PetDetails' &&
            getFocusedRouteNameFromRoute(route) !== 'DigitalWallet' &&
            getFocusedRouteNameFromRoute(route) !== 'PetRegistration',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="home-outline" size={20} />,
        })}
      />
      <MainTabs.Screen
        component={HealthRecordsNavigator}
        name="Health"
        options={{
          title: t('tabs.health'),
          tabBarIcon: ({ color }) => <Ionicons color={color} name="heart-outline" size={20} />,
        }}
      />
      <MainTabs.Screen
        component={AppointmentsScreen}
        name="Appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <Ionicons color={color} name="calendar-outline" size={20} />,
        }}
      />
      <MainTabs.Screen
        component={ClinicSearchScreen}
        name="Clinics"
        options={{
          title: t('tabs.clinics'),
          swipeEnabled: false,
          tabBarIcon: ({ color }) => <Ionicons color={color} name="map-outline" size={20} />,
        }}
      />
      <MainTabs.Screen
        component={ProfileScreen}
        name="Profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Ionicons color={color} name="person-outline" size={20} />,
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
