import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  PetDetails: {
    petId: string;
    petName: string;
  };
  DigitalWallet: {
    petId: string;
    petName: string;
  };
  PetRegistration: undefined;
};

export type AppointmentPrefill = {
  location?: string;
  _ts: number;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Health: undefined;
  Appointments: { prefill?: AppointmentPrefill } | undefined;
  Clinics: undefined;
  Profile: undefined;
};

export type HealthRecordsStackParamList = {
  Vaccine: undefined;
  Deworming: undefined;
  Medication: undefined;
};
