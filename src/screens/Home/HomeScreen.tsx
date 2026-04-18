import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PetResponseDto } from '@petcardorg/shared';
import { useNavigation } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PetCard } from '../../components/domain/PetCard';
import { PetCardSkeleton } from '../../components/ui/PetCardSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { usePets } from '../../hooks/usePets';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../utils/theme';

type HomeScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeList'>,
  MaterialTopTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigation>();
  const { pets, isLoading, isRefreshing, errorMessage, refresh, retry } = usePets();

  const handleAddPet = () => {
    navigation.navigate('Pets');
  };

  const handlePetPress = (pet: PetResponseDto) => {
    navigation.navigate('PetDetails', {
      petId: pet.id,
      petName: pet.name,
    });
  };

  const renderPet = ({ item }: ListRenderItemInfo<PetResponseDto>) => (
    <PetCard onPress={handlePetPress} pet={item} />
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (errorMessage) {
      return <ErrorState message={errorMessage} onRetry={retry} />;
    }

    return (
      <EmptyState
        actionLabel="Adicionar pet"
        description="Adicione seu primeiro pet para acompanhar vacinas, vermifugações e medicações."
        icon="paw-outline"
        onActionPress={handleAddPet}
        title="Nenhum pet cadastrado"
      />
    );
  };

  const renderListHeader = () => {
    if (!errorMessage || pets.length === 0) return null;

    return (
      <View style={styles.inlineWarning}>
        <Ionicons color={colors.warning} name="alert-circle" size={18} />
        <Text style={styles.inlineWarningText}>{errorMessage}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoMark}>
          <Ionicons color={colors.white} name="paw" size={20} />
        </View>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>
              Meus pets{!isLoading && pets.length > 0 ? ` (${pets.length})` : ''}
            </Text>
            <Text style={styles.subtitle}>Acompanhe a saúde dos seus pets.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleAddPet}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.white} name="add" size={18} style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>Adicionar</Text>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading && pets.length === 0 ? (
          <View style={styles.skeletonList}>
            <PetCardSkeleton />
            <PetCardSkeleton />
            <PetCardSkeleton />
          </View>
        ) : (
          <FlatList
            ListEmptyComponent={renderEmptyState}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={[
              styles.listContent,
              pets.length === 0 ? styles.emptyListContent : null,
            ]}
            data={pets}
            keyExtractor={(item) => item.id}
            onRefresh={refresh}
            refreshing={isRefreshing}
            renderItem={renderPet}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        )}

        {/* FAB visível só quando tem pets */}
        {!isLoading && pets.length > 0 ? (
          <FAB accessibilityLabel="Adicionar pet" onPress={handleAddPet} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 40,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleCopy: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addButtonIcon: {
    marginRight: spacing.xs,
  },
  addButtonText: {
    ...typography.button,
    color: colors.white,
  },
  skeletonList: {
    gap: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inlineWarning: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderColor: '#F3D084',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  inlineWarningText: {
    ...typography.label,
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
  },
});
