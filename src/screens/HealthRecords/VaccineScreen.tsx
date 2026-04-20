import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import type { HealthRecordsStackParamList } from '../../navigation/types';

type VaccineScreenProps = NativeStackScreenProps<HealthRecordsStackParamList, 'Vaccine'>;

export function VaccineScreen({ navigation }: VaccineScreenProps) {
  return (
    <ScreenContainer
      actionLabel="Ver vermifugações"
      onActionPress={() => navigation.navigate('Deworming')}
      secondaryActionLabel="Ver medicações"
      onSecondaryActionPress={() => navigation.navigate('Medication')}
      subtitle="Os registros de vacinas dos seus pets serão exibidos aqui em breve."
      title="Vacinas"
    />
  );
}
