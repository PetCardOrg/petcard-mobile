import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { AppointmentResponseDto } from '@petcardorg/shared';
import { colors, radii, spacing, typography } from '../../utils/theme';
import { formatScheduledAt, isUpcoming } from './horarioDoAgendamento';
import { estadoDeSincronizacao } from './estadoDeSincronizacao';
import { getRelativeDays } from './relativeDate';

type Props = {
  item: AppointmentResponseDto;
  /** Se o Google Agenda do tutor está conectado: muda o que um pendente significa. */
  calendarConnected: boolean;
  onEdit: (item: AppointmentResponseDto) => void;
  onDelete: (item: AppointmentResponseDto) => void;
};

export function AppointmentCard({ item, calendarConnected, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const { date, time } = formatScheduledAt(item.scheduled_at);
  const upcoming = isUpcoming(item.scheduled_at);
  const sync = estadoDeSincronizacao(item.sync_status, calendarConnected);

  return (
    <View style={[styles.appointmentCard, !upcoming && styles.pastCard]}>
      <View style={styles.appointmentHeader}>
        <View style={styles.dateTimeBadge}>
          <Ionicons color={colors.white} name="calendar" size={14} />
          <Text style={styles.dateTimeBadgeText}>{date}</Text>
          <Text style={styles.dateTimeBadgeText}>{time}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => onEdit(item)} hitSlop={8} style={styles.actionButton}>
            <Ionicons color={colors.primaryDark} name="create-outline" size={18} />
          </Pressable>
          <Pressable onPress={() => onDelete(item)} hitSlop={8} style={styles.actionButton}>
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

        {sync ? (
          <View style={styles.metaRow}>
            <Ionicons color={CORES_DO_ESTADO[sync.tom]} name={sync.icone} size={15} />
            <Text style={[styles.metaText, sync.tom === 'falha' && styles.syncFalhou]}>
              {t(`appointments.sync.${sync.chave}`)}
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
              // `date` já vem em horário local; fatiar o ISO daria a data UTC,
              // um dia à frente para agendamentos à noite.
              return date;
            })()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const CORES_DO_ESTADO = {
  ok: colors.success,
  neutro: colors.muted,
  falha: colors.danger,
};

const styles = StyleSheet.create({
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
  syncFalhou: {
    color: colors.danger,
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
});
