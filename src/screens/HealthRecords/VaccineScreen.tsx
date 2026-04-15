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
      subtitle="Registros de vacina do pet selecionado entram na PC-041."
      title="Vaccine Screen"
    />
  );
}
