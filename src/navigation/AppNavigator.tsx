import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { PetsProvider } from '../contexts/PetsContext';
import { SelectedPetProvider } from '../contexts/SelectedPetContext';
import { HealthRecordsNavigator } from './HealthRecordsNavigator';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useEmailVerificationLink } from '../hooks/useEmailVerificationLink';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/Auth/ResetPasswordScreen';
import { VerifyEmailScreen } from '../screens/Auth/VerifyEmailScreen';
import { ClinicalHistoryScreen } from '../screens/Home/ClinicalHistoryScreen';
import { DigitalWalletScreen } from '../screens/DigitalWallet/DigitalWalletScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PetDetailsScreen } from '../screens/Home/PetDetailsScreen';
import { PetRegistrationScreen } from '../screens/PetRegistration/PetRegistrationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ClinicSearchScreen } from '../screens/ClinicSearch/ClinicSearchScreen';
import { AppointmentsScreen } from '../screens/Appointments/AppointmentsScreen';
import { colors } from '../utils/theme';
import type { AuthStackParamList, HomeStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MainTabs = createMaterialTopTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={LoginScreen} name="Login" />
      <AuthStack.Screen component={RegisterScreen} name="Register" />
      <AuthStack.Screen component={ForgotPasswordScreen} name="ForgotPassword" />
      <AuthStack.Screen component={ResetPasswordScreen} name="ResetPassword" />
      <AuthStack.Screen component={VerifyEmailScreen} name="VerifyEmail" />
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
        component={ClinicalHistoryScreen}
        name="ClinicalHistory"
        options={{ title: t('clinicalHistory.title') }}
      />
      <HomeStack.Screen
        component={PetRegistrationScreen}
        name="PetRegistration"
        options={{ title: t('petRegistration.title') }}
      />
    </HomeStack.Navigator>
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
            getFocusedRouteNameFromRoute(route) !== 'ClinicalHistory' &&
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
  const { isAuthenticated, isBootstrapping } = useAuth();
  useEmailVerificationLink();

  if (isBootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Ambos envolvem o app autenticado, não só a aba de saúde: a lista de pets
  // é compartilhada por Home, agendamentos e telas de saúde, e a escolha do
  // pet precisa sobreviver a ir para a Home e voltar.
  return (
    <PetsProvider>
      <SelectedPetProvider>
        <MainNavigator />
      </SelectedPetProvider>
    </PetsProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
