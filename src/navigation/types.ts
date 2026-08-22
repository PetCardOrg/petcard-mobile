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
  ClinicalHistory: {
    petId: string;
    petName: string;
  };
  PetRegistration: undefined;
};

export type AppointmentPrefill = {
  location?: string;
  _ts: number;
};

/** Aba da seção de saúde, na ordem em que aparecem no controle segmentado. */
export type AbaDeSaude = 'vaccines' | 'dewormings' | 'medications';

export type PedidoDeAbaDeSaude = {
  aba: AbaDeSaude;
  /** Repetir o mesmo pedido precisa reabrir a aba; sem isto os params seriam iguais. */
  _ts: number;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Health: { abrir?: PedidoDeAbaDeSaude } | undefined;
  Appointments: { prefill?: AppointmentPrefill } | undefined;
  Clinics: undefined;
  Profile: undefined;
};

export type HealthRecordsStackParamList = {
  Vaccine: undefined;
  Deworming: undefined;
  Medication: undefined;
};
