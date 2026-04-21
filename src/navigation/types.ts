import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  PetDetails: {
    petId: string;
    petName: string;
  };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Pets: undefined;
  Health: undefined;
  Profile: undefined;
};

export type HealthRecordsStackParamList = {
  Vaccine: undefined;
  Deworming: undefined;
  Medication: undefined;
};
