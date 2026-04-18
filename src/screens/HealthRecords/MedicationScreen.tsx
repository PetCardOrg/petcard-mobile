import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import type { HealthRecordsStackParamList } from '../../navigation/types';

type MedicationScreenProps = NativeStackScreenProps<HealthRecordsStackParamList, 'Medication'>;

export function MedicationScreen({ navigation }: MedicationScreenProps) {
  return (
    <ScreenContainer
      actionLabel="Ver vacinas"
      onActionPress={() => navigation.navigate('Vaccine')}
      secondaryActionLabel="Ver vermifugações"
      onSecondaryActionPress={() => navigation.navigate('Deworming')}
      subtitle="Os registros de medicação dos seus pets serão exibidos aqui em breve."
      title="Medicações"
    />
  );
}
