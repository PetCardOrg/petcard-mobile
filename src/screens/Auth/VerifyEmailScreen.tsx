import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { authService } from '../../services';
import { colors, radii, spacing } from '../../utils/theme';
import type { AuthStackParamList } from '../../navigation/types';

type VerifyNav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type VerifyRoute = RouteProp<AuthStackParamList, 'VerifyEmail'>;

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<VerifyNav>();
  const route = useRoute<VerifyRoute>();
  const token = route.params?.token;

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;
    let active = true;
    authService
      .verifyEmail(token)
      .then(() => active && setStatus('success'))
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <ScreenContainer
      actionLabel={status === 'loading' ? undefined : t('emailVerification.continue')}
      onActionPress={() => navigation.navigate('Login')}
      subtitle={
        status === 'success'
          ? t('emailVerification.successSubtitle')
          : status === 'error'
            ? t('emailVerification.errorSubtitle')
            : t('emailVerification.loadingSubtitle')
      }
      title={t('emailVerification.title')}
    >
      {status === 'loading' ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View
          style={[styles.notice, status === 'success' ? styles.noticeSuccess : styles.noticeError]}
        >
          <Text style={styles.noticeText}>
            {status === 'success'
              ? t('emailVerification.successMessage')
              : t('emailVerification.errorMessage')}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.lg,
  },
  notice: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noticeSuccess: {
    backgroundColor: colors.successSoft,
  },
  noticeError: {
    backgroundColor: colors.dangerSoft,
  },
  noticeText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
