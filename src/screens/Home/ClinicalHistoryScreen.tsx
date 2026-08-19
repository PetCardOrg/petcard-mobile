import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HistoricoClinicoItemResponseDto } from '@petcardorg/shared';
import { EntidadeClinica } from '@petcardorg/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import type { HomeStackParamList } from '../../navigation/types';
import { historicoService } from '../../services';
import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ClinicalHistory'>;

const ENTIDADE_ICON: Record<EntidadeClinica, keyof typeof Ionicons.glyphMap> = {
  [EntidadeClinica.VACINA]: 'medkit-outline',
  [EntidadeClinica.VERMIFUGO]: 'bug-outline',
  [EntidadeClinica.MEDICACAO]: 'bandage-outline',
  [EntidadeClinica.NOTA_CLINICA]: 'document-text-outline',
};

/**
 * A data clínica vem como dia de calendário (`YYYY-MM-DD`) em vacina,
 * vermífugo e medicação, e como instante na nota clínica. Dia de calendário
 * não pode passar pelo `Date`: em fuso negativo viraria o dia anterior.
 */
function formatarData(valor: string): string {
  const soData = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soData) return `${soData[3]}/${soData[2]}/${soData[1]}`;

  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime())) return valor;
  return instante.toLocaleDateString('pt-BR');
}

function assinatura(nome?: string, crmv?: string): string | null {
  if (!nome) return null;
  return crmv ? `${nome} — ${crmv}` : nome;
}

function HistoricoItem({ item }: { item: HistoricoClinicoItemResponseDto }) {
  const { t } = useTranslation();
  const autor = assinatura(item.veterinario_nome, item.veterinario_crmv);

  return (
    <View style={[styles.card, item.excluido && styles.cardExcluido]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons color={colors.primary} name={ENTIDADE_ICON[item.entidade]} size={18} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <Text style={styles.cardType}>{t(`clinicalHistory.entidade.${item.entidade}`)}</Text>
        </View>
        <Text style={styles.cardDate}>{formatarData(item.ocorrido_em)}</Text>
      </View>

      {item.descricao ? <Text style={styles.cardDescription}>{item.descricao}</Text> : null}

      {autor ? (
        <View style={styles.cardAuthor}>
          <Ionicons color={colors.muted} name="person-outline" size={13} />
          <Text style={styles.cardAuthorText}>{autor}</Text>
        </View>
      ) : null}

      {item.excluido ? (
        <View style={styles.badgeExcluido}>
          <Ionicons color={colors.danger} name="trash-outline" size={12} />
          <Text style={styles.badgeExcluidoText}>{t('clinicalHistory.excluido')}</Text>
        </View>
      ) : null}

      {item.acoes.length > 0 ? (
        <View style={styles.trilha}>
          {item.acoes.map((acao) => (
            <Text key={acao.id} style={styles.trilhaLinha}>
              {t(`clinicalHistory.acao.${acao.tipo}`)} · {acao.autor_nome}
              {acao.autor_crmv ? ` (${acao.autor_crmv})` : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ClinicalHistoryScreen({ route }: Props) {
  const { t } = useTranslation();
  const { petId } = route.params;

  const [itens, setItens] = useState<HistoricoClinicoItemResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const carregar = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setIsRefreshing(true);
      else setIsLoading(true);

      try {
        setError(false);
        const data = await historicoService.getHistoricoClinico(petId);
        setItens(data.itens);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [petId],
  );

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t('clinicalHistory.error')} onRetry={() => void carregar()} />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={[styles.list, itens.length === 0 && styles.listEmpty]}
      data={itens}
      keyExtractor={(item) => `${item.entidade}-${item.entidade_id}`}
      ListEmptyComponent={
        <EmptyState
          description={t('clinicalHistory.emptyDescription')}
          icon="time-outline"
          title={t('clinicalHistory.emptyTitle')}
        />
      }
      ListHeaderComponent={
        itens.length > 0 ? <Text style={styles.intro}>{t('clinicalHistory.intro')}</Text> : null
      }
      refreshControl={
        <RefreshControl onRefresh={() => void carregar('refresh')} refreshing={isRefreshing} />
      }
      renderItem={({ item }) => <HistoricoItem item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  badgeExcluido: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeExcluidoText: {
    color: colors.danger,
    ...typography.caption,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardAuthor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  cardAuthorText: {
    color: colors.muted,
    ...typography.caption,
  },
  cardDate: {
    color: colors.muted,
    ...typography.caption,
  },
  cardDescription: {
    color: colors.text,
    ...typography.body,
    marginTop: spacing.sm,
  },
  cardExcluido: {
    opacity: 0.65,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cardTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: '700',
  },
  cardType: {
    color: colors.muted,
    ...typography.caption,
  },
  centered: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  intro: {
    color: colors.muted,
    ...typography.caption,
    marginBottom: spacing.md,
  },
  list: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.md,
  },
  listEmpty: {
    justifyContent: 'center',
  },
  trilha: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  trilhaLinha: {
    color: colors.muted,
    ...typography.caption,
  },
});
