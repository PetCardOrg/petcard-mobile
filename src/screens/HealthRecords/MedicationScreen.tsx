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
      subtitle="Registros de medicação do pet selecionado entram na PC-043."
      title="Medication Screen"
    />
  );
}
