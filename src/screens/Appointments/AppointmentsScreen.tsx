import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PetResponseDto } from '@petcardorg/shared';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

import type { MainTabParamList } from '../../navigation/types';

import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { usePets } from '../../hooks/usePets';
import { appointmentService, calendarService } from '../../services';
import type { AppointmentResponse } from '../../services/appointment.service';
import { formatDateDisplay, formatDateInput, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';

type FormErrors = {
  title?: string;
  scheduledDate?: string;
  scheduledTime?: string;
};

function formatTime(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function parseTime(text: string): { hours: number; minutes: number } | undefined {
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return { hours, minutes };
}

function formatScheduledAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
}

function isUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}

function getRelativeDays(iso: string): number {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export function AppointmentsScreen() {
  const { t } = useTranslation();
  const { pets } = usePets();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<MainTabParamList, 'Appointments'>>();
  const lastPrefillTs = useRef(0);

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar sync state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AppointmentResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadAppointments = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
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
        let message = t('appointments.errorLoad');
        if (isAxiosError(err) && err.response?.data?.message) {
          message = String(err.response.data.message);
        }
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [t],
  );

  const checkCalendarStatus = useCallback(async () => {
    try {
      const connected = await calendarService.getStatus();
      setCalendarConnected(connected);
    } catch {
      // Silently fail — calendar status is not critical
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
      void checkCalendarStatus();
    }, [loadAppointments, checkCalendarStatus]),
  );

  // Handle prefill from clinic screen
  useEffect(() => {
    const prefill = route.params?.prefill;
    if (prefill && prefill._ts !== lastPrefillTs.current) {
      lastPrefillTs.current = prefill._ts;
      resetForm();
      setLocation(prefill.location ?? '');
      setModalVisible(true);
    }
  }, [route.params?.prefill]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setScheduledDate('');
    setScheduledTime('');
    setDurationMinutes(60);
    setLocation('');
    setSelectedPetId(undefined);
    setFormErrors({});
    setEditingRecord(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(record: AppointmentResponse) {
    setEditingRecord(record);
    const { date, time } = formatScheduledAt(record.scheduled_at);
    setTitle(record.title);
    setDescription(record.description ?? '');
    setScheduledDate(date);
    setScheduledTime(time);
    setDurationMinutes(record.duration_minutes);
    setLocation(record.location ?? '');
    setSelectedPetId(record.pet_id);
    setFormErrors({});
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
      let message = t('appointments.errorDelete');
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert(t('common.error'), message);
    }
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!title.trim()) errors.title = t('appointments.validation.titleRequired');
    if (!scheduledDate.trim()) {
      errors.scheduledDate = t('appointments.validation.dateRequired');
    } else if (!parseDate(scheduledDate)) {
      errors.scheduledDate = t('validation.dateInvalid');
    }
    if (!scheduledTime.trim()) {
      errors.scheduledTime = t('appointments.validation.timeRequired');
    } else if (!parseTime(scheduledTime)) {
      errors.scheduledTime = t('appointments.validation.timeInvalid');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const dateStr = parseDate(scheduledDate)!;
    const time = parseTime(scheduledTime)!;
    const scheduledAt = new Date(
      `${dateStr}T${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:00`,
    );

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        location: location.trim() || undefined,
        pet_id: selectedPetId,
      };

      if (editingRecord) {
        await appointmentService.update(editingRecord.id, payload);
        setModalVisible(false);
        Alert.alert(t('common.success'), t('appointments.successEdit'));
      } else {
        await appointmentService.create(payload);
        setModalVisible(false);
        Alert.alert(t('common.success'), t('appointments.successCreate'));
      }
      void loadAppointments();
    } catch (err) {
      let message = editingRecord ? t('appointments.errorEdit') : t('appointments.errorCreate');
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCalendarConnect() {
    try {
      const url = await calendarService.getConnectUrl();
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('appointments.calendar.notConfigured'));
      }
    } catch {
      Alert.alert(t('common.error'), t('appointments.calendar.connectError'));
    }
  }

  async function handleCalendarSync() {
    setIsSyncing(true);
    try {
      const count = await calendarService.syncAll();
      Alert.alert(t('common.success'), t('appointments.calendar.syncSuccess', { count }));
    } catch {
      Alert.alert(t('common.error'), t('appointments.calendar.syncError'));
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleCalendarDisconnect() {
    Alert.alert(
      t('appointments.calendar.disconnectTitle'),
      t('appointments.calendar.disconnectMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('appointments.calendar.disconnectConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarService.disconnect();
              setCalendarConnected(false);
            } catch {
              Alert.alert(t('common.error'), t('appointments.calendar.disconnectError'));
            }
          },
        },
      ],
    );
  }

  function getSyncStatusColor(status: string) {
    switch (status) {
      case 'SYNCED':
        return colors.success;
      case 'FAILED':
        return colors.danger;
      default:
        return colors.warning;
    }
  }

  function getSyncStatusLabel(status: string): string {
    switch (status) {
      case 'SYNCED':
        return t('appointments.syncStatus.synced');
      case 'FAILED':
        return t('appointments.syncStatus.failed');
      case 'PENDING_CREATE':
      case 'PENDING_UPDATE':
        return t('appointments.syncStatus.pending');
      default:
        return status;
    }
  }

  function renderAppointmentItem({ item }: { item: AppointmentResponse }) {
    const { date, time } = formatScheduledAt(item.scheduled_at);
    const upcoming = isUpcoming(item.scheduled_at);

    return (
      <View style={[styles.appointmentCard, !upcoming && styles.pastCard]}>
        <View style={styles.appointmentHeader}>
          <View style={styles.dateTimeBadge}>
            <Ionicons color={colors.white} name="calendar" size={14} />
            <Text style={styles.dateTimeBadgeText}>{date}</Text>
            <Text style={styles.dateTimeBadgeText}>{time}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => openEditModal(item)} hitSlop={8} style={styles.actionButton}>
              <Ionicons color={colors.primaryDark} name="create-outline" size={18} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.actionButton}>
              <Ionicons color={colors.danger} name="trash-outline" size={18} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.appointmentTitle}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.appointmentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.appointmentMeta}>
          <View style={styles.metaRow}>
            <Ionicons color={colors.muted} name="time-outline" size={15} />
            <Text style={styles.metaText}>
              {item.duration_minutes} {t('appointments.minutes')}
            </Text>
          </View>

          {item.location ? (
            <View style={styles.metaRow}>
              <Ionicons color={colors.muted} name="location-outline" size={15} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}

          {item.pet_name ? (
            <View style={styles.metaRow}>
              <Ionicons color={colors.muted} name="paw-outline" size={15} />
              <Text style={styles.metaText}>{item.pet_name}</Text>
            </View>
          ) : null}

          {calendarConnected ? (
            <View style={styles.metaRow}>
              <View
                style={[styles.syncDot, { backgroundColor: getSyncStatusColor(item.sync_status) }]}
              />
              <Text style={[styles.metaText, { color: getSyncStatusColor(item.sync_status) }]}>
                {getSyncStatusLabel(item.sync_status)}
              </Text>
            </View>
          ) : null}
        </View>

        {upcoming ? (
          <View style={styles.relativeContainer}>
            <Text style={styles.relativeText}>
              {(() => {
                const days = getRelativeDays(item.scheduled_at);
                if (days === 0) return t('appointments.today');
                if (days === 1) return t('appointments.tomorrow');
                if (days > 1 && days <= 7) return `${days} ${t('appointments.daysAway')}`;
                return formatDateDisplay(item.scheduled_at.split('T')[0]);
              })()}
            </Text>
          </View>
        ) : null}
      </View>
    );
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

      {/* Google Calendar Banner */}
      <View style={styles.calendarBanner}>
        <View style={styles.calendarBannerLeft}>
          <Ionicons
            name={calendarConnected ? 'checkmark-circle' : 'logo-google'}
            size={20}
            color={calendarConnected ? colors.success : colors.primaryDark}
          />
          <Text style={styles.calendarBannerText}>
            {calendarConnected
              ? t('appointments.calendar.connected')
              : t('appointments.calendar.notConnected')}
          </Text>
        </View>
        <View style={styles.calendarBannerActions}>
          {calendarConnected ? (
            <>
              <Pressable
                onPress={handleCalendarSync}
                disabled={isSyncing}
                style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="sync" size={14} color={colors.white} />
                    <Text style={styles.syncButtonText}>{t('appointments.calendar.sync')}</Text>
                  </>
                )}
              </Pressable>
              <Pressable onPress={handleCalendarDisconnect} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleCalendarConnect}
              style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}
            >
              <Text style={styles.connectButtonText}>{t('appointments.calendar.connect')}</Text>
            </Pressable>
          )}
        </View>
      </View>

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
            onActionPress={openCreateModal}
          />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentItem}
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
        <FAB accessibilityLabel={t('appointments.addAccessibility')} onPress={openCreateModal} />
      ) : null}

      {/* Form Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingRecord ? t('appointments.editTitle') : t('appointments.createTitle')}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Title */}
                <View style={styles.field}>
                  <Text style={styles.label}>{t('appointments.form.titleLabel')}</Text>
                  <TextInput
                    autoCapitalize="sentences"
                    onChangeText={(text) => {
                      setTitle(text);
                      if (formErrors.title) setFormErrors((e) => ({ ...e, title: undefined }));
                    }}
                    placeholder={t('appointments.form.titlePlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.title ? styles.inputError : null]}
                    value={title}
                  />
                  {formErrors.title ? (
                    <Text style={styles.errorText}>{formErrors.title}</Text>
                  ) : null}
                </View>

                {/* Date & Time row */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.flex1]}>
                    <Text style={styles.label}>{t('appointments.form.dateLabel')}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      maxLength={10}
                      onChangeText={(text) => {
                        setScheduledDate(formatDateInput(text));
                        if (formErrors.scheduledDate)
                          setFormErrors((e) => ({ ...e, scheduledDate: undefined }));
                      }}
                      placeholder={t('common.datePlaceholder')}
                      placeholderTextColor={colors.muted}
                      style={[styles.input, formErrors.scheduledDate ? styles.inputError : null]}
                      value={scheduledDate}
                    />
                    {formErrors.scheduledDate ? (
                      <Text style={styles.errorText}>{formErrors.scheduledDate}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.field, { flex: 0.6 }]}>
                    <Text style={styles.label}>{t('appointments.form.timeLabel')}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      maxLength={5}
                      onChangeText={(text) => {
                        setScheduledTime(formatTime(text));
                        if (formErrors.scheduledTime)
                          setFormErrors((e) => ({ ...e, scheduledTime: undefined }));
                      }}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, formErrors.scheduledTime ? styles.inputError : null]}
                      value={scheduledTime}
                    />
                    {formErrors.scheduledTime ? (
                      <Text style={styles.errorText}>{formErrors.scheduledTime}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.field}>
                  <Text style={styles.label}>{t('appointments.form.durationLabel')}</Text>
                  <View style={styles.durationRow}>
                    {DURATION_OPTIONS.map((d) => (
                      <Pressable
                        key={d}
                        onPress={() => setDurationMinutes(d)}
                        style={[
                          styles.durationChip,
                          durationMinutes === d && styles.durationChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            durationMinutes === d && styles.durationChipTextActive,
                          ]}
                        >
                          {d}min
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Location */}
                <View style={styles.field}>
                  <Text style={styles.label}>{t('appointments.form.locationLabel')}</Text>
                  <TextInput
                    autoCapitalize="sentences"
                    onChangeText={setLocation}
                    placeholder={t('appointments.form.locationPlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={location}
                  />
                </View>

                {/* Pet selector */}
                {pets.length > 0 ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('appointments.form.petLabel')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.petChipRow}>
                        <Pressable
                          onPress={() => setSelectedPetId(undefined)}
                          style={[styles.petChip, !selectedPetId && styles.petChipActive]}
                        >
                          <Text
                            style={[styles.petChipText, !selectedPetId && styles.petChipTextActive]}
                          >
                            {t('appointments.form.noPet')}
                          </Text>
                        </Pressable>
                        {pets.map((pet: PetResponseDto) => (
                          <Pressable
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            style={[
                              styles.petChip,
                              selectedPetId === pet.id && styles.petChipActive,
                            ]}
                          >
                            <Ionicons
                              name="paw"
                              size={14}
                              color={selectedPetId === pet.id ? colors.white : colors.primaryDark}
                            />
                            <Text
                              style={[
                                styles.petChipText,
                                selectedPetId === pet.id && styles.petChipTextActive,
                              ]}
                            >
                              {pet.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {/* Description */}
                <View style={styles.field}>
                  <Text style={styles.label}>{t('appointments.form.descriptionLabel')}</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    onChangeText={setDescription}
                    placeholder={t('appointments.form.descriptionPlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.textArea]}
                    textAlignVertical="top"
                    value={description}
                  />
                </View>

                {/* Submit */}
                <Pressable
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingRecord
                        ? t('appointments.submitEdit')
                        : t('appointments.submitCreate')}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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

  // Calendar Banner
  calendarBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  calendarBannerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  calendarBannerText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  calendarBannerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  connectButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  connectButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  syncButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  syncButtonText: {
    ...typography.caption,
    color: colors.white,
  },

  // List
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl + 60,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  pastCard: {
    opacity: 0.6,
  },
  appointmentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dateTimeBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateTimeBadgeText: {
    ...typography.caption,
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  appointmentTitle: {
    ...typography.h3,
    color: colors.text,
  },
  appointmentDescription: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  appointmentMeta: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.muted,
    flex: 1,
  },
  syncDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  relativeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  relativeText: {
    ...typography.caption,
    color: colors.primaryDark,
  },

  // Modal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },

  // Form
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  durationChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  durationChipText: {
    ...typography.caption,
    color: colors.muted,
  },
  durationChipTextActive: {
    color: colors.white,
  },
  petChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  petChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  petChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  petChipText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  petChipTextActive: {
    color: colors.white,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
