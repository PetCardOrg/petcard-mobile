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
      subtitle="Os registros de vermifugação dos seus pets serão exibidos aqui em breve."
      title="Vermifugações"
    />
  );
}
