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
};

export type AppointmentPrefill = {
  location?: string;
  _ts: number;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Pets: undefined;
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
