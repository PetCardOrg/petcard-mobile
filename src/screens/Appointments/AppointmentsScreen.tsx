import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { MainTabParamList } from '../../navigation/types';

import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { appointmentService } from '../../services';
import type { AppointmentResponse } from '../../services/appointment.service';
import { colors, spacing, typography } from '../../utils/theme';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentFormModal } from './AppointmentFormModal';
import { CalendarBanner } from './CalendarBanner';
import { CalendarConnectedModal } from './CalendarConnectedModal';
import { useGoogleCalendar } from './useGoogleCalendar';

type Formulario = {
  record: AppointmentResponse | null;
  initialLocation: string;
  session: number;
};

export function AppointmentsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<MainTabParamList, 'Appointments'>>();
  const lastPrefillTs = useRef(0);
  const calendar = useGoogleCalendar();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [formulario, setFormulario] = useState<Formulario>({
    record: null,
    initialLocation: '',
    session: 0,
  });

  const loadAppointments = useCallback(
    async (mode?: 'initial' | 'refresh') => {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await appointmentService.getUpcoming();
        setAppointments(data);
      } catch (err) {
        const message = apiErrorMessage(err, t('appointments.errorLoad'), t);
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [t],
  );

  const { checkStatus } = calendar;
  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
      void checkStatus();
    }, [loadAppointments, checkStatus]),
  );

  // Handle prefill from clinic screen
  useEffect(() => {
    const prefill = route.params?.prefill;
    if (prefill && prefill._ts !== lastPrefillTs.current) {
      lastPrefillTs.current = prefill._ts;
      abrirFormulario(null, prefill.location ?? '');
    }
  }, [route.params?.prefill]);

  /** Abre o formulário do zero: em branco, com o local dado ou com o registro em edição. */
  function abrirFormulario(record: AppointmentResponse | null, initialLocation = '') {
    setFormulario((f) => ({ record, initialLocation, session: f.session + 1 }));
    setModalVisible(true);
  }

  function confirmDelete(record: AppointmentResponse) {
    Alert.alert(
      t('appointments.deleteTitle'),
      t('appointments.deleteMessage', { name: record.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('appointments.deleteConfirm'),
          style: 'destructive',
          onPress: () => void handleDelete(record.id),
        },
      ],
    );
  }

  async function handleDelete(id: string) {
    try {
      await appointmentService.remove(id);
      void loadAppointments();
    } catch (err) {
      const message = apiErrorMessage(err, t('appointments.errorDelete'), t);
      Alert.alert(t('common.error'), message);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>{t('appointments.title')}</Text>
          <Text style={styles.screenSubtitle}>{t('appointments.subtitle')}</Text>
        </View>
      </View>

      <CalendarBanner
        connected={calendar.connected}
        onConnect={() => void calendar.connect()}
        onDisconnect={calendar.disconnect}
      />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ErrorState message={error} onRetry={() => void loadAppointments()} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="calendar-outline"
            title={t('appointments.emptyTitle')}
            description={t('appointments.emptyDescription')}
            actionLabel={t('appointments.emptyAction')}
            onActionPress={() => abrirFormulario(null)}
          />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onDelete={confirmDelete}
              onEdit={(record) => abrirFormulario(record)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadAppointments('refresh')}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {!isLoading && !error && appointments.length > 0 ? (
        <FAB
          accessibilityLabel={t('appointments.addAccessibility')}
          onPress={() => abrirFormulario(null)}
        />
      ) : null}

      <AppointmentFormModal
        initialLocation={formulario.initialLocation}
        onClose={() => setModalVisible(false)}
        onSaved={() => void loadAppointments()}
        record={formulario.record}
        session={formulario.session}
        visible={modalVisible}
      />

      <CalendarConnectedModal onClose={calendar.closeSuccess} visible={calendar.successVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  screenHeader: {
    marginBottom: spacing.md,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.text,
  },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl + 60,
  },
});
