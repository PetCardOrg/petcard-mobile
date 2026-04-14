import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import type { HealthRecordsStackParamList } from '../../navigation/types';

type DewormingScreenProps = NativeStackScreenProps<HealthRecordsStackParamList, 'Deworming'>;

export function DewormingScreen({ navigation }: DewormingScreenProps) {
  return (
    <ScreenContainer
      actionLabel="Ver medicações"
      onActionPress={() => navigation.navigate('Medication')}
      secondaryActionLabel="Ver vacinas"
      onSecondaryActionPress={() => navigation.navigate('Vaccine')}
      subtitle="Registros de vermifugação do pet selecionado entram na PC-042."
      title="Deworming Screen"
    />
  );
}
