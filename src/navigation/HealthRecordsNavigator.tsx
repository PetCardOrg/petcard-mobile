import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { DewormingScreen } from '../screens/HealthRecords/DewormingScreen';
import { MedicationScreen } from '../screens/HealthRecords/MedicationScreen';
import { VaccineScreen } from '../screens/HealthRecords/VaccineScreen';
import type { AbaDeSaude, MainTabParamList } from './types';
import { colors, radii, spacing, typography } from '../utils/theme';

const ABAS = [
  {
    key: 'vaccines',
    labelKey: 'healthRecords.tabs.vaccines',
    icon: 'medkit-outline',
    Screen: VaccineScreen,
  },
  {
    key: 'dewormings',
    labelKey: 'healthRecords.tabs.dewormings',
    icon: 'bug-outline',
    Screen: DewormingScreen,
  },
  {
    key: 'medications',
    labelKey: 'healthRecords.tabs.medications',
    icon: 'bandage-outline',
    Screen: MedicationScreen,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  Screen: () => React.JSX.Element;
}>;

/**
 * Abas de vacina, vermífugo e medicação.
 *
 * A aba visitada **continua montada** e é apenas escondida: trocar de aba
 * antes desmontava a tela, e voltar recarregava a lista da API, com spinner no
 * meio de um gesto que deveria ser instantâneo.
 *
 * A montagem é preguiçosa — aba nunca aberta não monta. As três telas buscam a
 * lista de pets ao montar, e montar todas de uma vez faria três chamadas na
 * abertura da aba de saúde para telas que o tutor talvez nem abra.
 *
 * O resumo de saúde da carteira digital pede uma aba específica pelos params
 * da rota; quem pede também deixa o pet escolhido no `SelectedPetContext`.
 */
export function HealthRecordsNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const route = useRoute<RouteProp<MainTabParamList, 'Health'>>();
  const [activeTab, setActiveTab] = useState<AbaDeSaude>(ABAS[0].key);
  const [montadas, setMontadas] = useState<AbaDeSaude[]>([ABAS[0].key]);

  const abrirAba = useCallback((key: AbaDeSaude) => {
    setActiveTab(key);
    setMontadas((atual) => (atual.includes(key) ? atual : [...atual, key]));
  }, []);

  // Só o `_ts` distingue dois pedidos para a mesma aba: sem ele, tocar duas
  // vezes no mesmo card da carteira não reabriria a aba na segunda.
  const ultimoPedido = useRef<number | null>(null);
  const pedido = route.params?.abrir;
  useEffect(() => {
    if (pedido && pedido._ts !== ultimoPedido.current) {
      ultimoPedido.current = pedido._ts;
      abrirAba(pedido.aba);
    }
  }, [pedido, abrirAba]);

  return (
    <View style={styles.container}>
      <View style={[styles.segmentedControl, { marginTop: insets.top + spacing.sm }]}>
        {ABAS.map((aba) => {
          const isActive = aba.key === activeTab;
          return (
            <Pressable
              key={aba.key}
              onPress={() => abrirAba(aba.key)}
              style={[styles.segment, isActive && styles.segmentActive]}
            >
              <Ionicons name={aba.icon} size={16} color={isActive ? colors.white : colors.muted} />
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {t(aba.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.content}>
        {ABAS.filter((aba) => montadas.includes(aba.key)).map(({ key, Screen }) => (
          // `display: none` esconde sem desmontar, preservando pet escolhido,
          // lista carregada e posição de rolagem.
          <View
            key={key}
            pointerEvents={key === activeTab ? 'auto' : 'none'}
            style={key === activeTab ? styles.abaAtiva : styles.abaEscondida}
          >
            <Screen />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abaAtiva: {
    flex: 1,
  },
  abaEscondida: {
    display: 'none',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.md - 2,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: colors.primaryDark,
  },
  segmentText: {
    ...typography.caption,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.white,
  },
  segmentedControl: {
    backgroundColor: colors.border,
    borderRadius: radii.md,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: 3,
  },
});
