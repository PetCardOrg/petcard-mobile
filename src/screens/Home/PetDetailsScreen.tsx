import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Species, type PetResponseDto } from '@petcardorg/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';

import { petService, uploadService } from '../../services';
import type { HomeStackParamList } from '../../navigation/types';
import { calculateAge } from '../../utils/calculateAge';
import { formatDateInput, parseDate } from '../../utils/dateUtils';
import { getPhotoUrl, SEX_CONFIG, SPECIES_CONFIG } from '../../utils/petConfig';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PetDetailsScreenProps = NativeStackScreenProps<HomeStackParamList, 'PetDetails'>;

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons color={colors.primary} name={icon} size={20} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

type EditFormErrors = {
  name?: string;
  birthDate?: string;
};

export function PetDetailsScreen({ route, navigation }: PetDetailsScreenProps) {
  const [pet, setPet] = useState<PetResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<EditFormErrors>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          setIsLoading(true);
          setError(false);
          const data = await petService.getPetById(route.params.petId);
          if (!cancelled) setPet(data);
        } catch {
          if (!cancelled) setError(true);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [route.params.petId]),
  );

  function openEditModal() {
    if (!pet) return;
    setEditName(pet.name);
    setEditBreed(pet.breed ?? '');
    setEditBirthDate(pet.birth_date ? isoToDisplay(pet.birth_date) : '');
    setEditWeight(pet.weight != null ? String(pet.weight) : '');
    setEditImageUri(null);
    setEditFormErrors({});
    setEditModalVisible(true);
  }

  async function handlePickEditImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à galeria para selecionar uma foto.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditImageUri(result.assets[0].uri);
    }
  }

  function validateEditForm(): boolean {
    const errors: EditFormErrors = {};
    if (!editName.trim()) errors.name = 'Nome é obrigatório';
    if (editBirthDate.length > 0 && !parseDate(editBirthDate)) {
      errors.birthDate = 'Data inválida. Use DD/MM/AAAA';
    }
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleEditSubmit() {
    if (!validateEditForm() || !pet) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
      };
      if (editBreed.trim()) payload.breed = editBreed.trim();
      if (editBirthDate) {
        const parsed = parseDate(editBirthDate);
        if (parsed) payload.birth_date = parsed;
      }
      if (editWeight.trim()) {
        const num = parseFloat(editWeight.replace(',', '.'));
        if (!isNaN(num) && num > 0) payload.weight = num;
      }

      if (editImageUri) {
        const photoUrl = await uploadService.uploadImage(editImageUri, 'pets');
        payload.photo_url = photoUrl;
      }

      const updated = await petService.updatePet(pet.id, payload);
      setPet(updated);
      navigation.setParams({ petName: updated.name });
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Pet atualizado com sucesso!');
    } catch (err) {
      let message = 'Não foi possível atualizar o pet.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!pet) return;
    Alert.alert(
      'Excluir pet',
      `Deseja excluir "${pet.name}"? Todos os registros de saúde serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void handleDelete(),
        },
      ],
    );
  }

  async function handleDelete() {
    if (!pet) return;
    try {
      await petService.deletePet(pet.id);
      Alert.alert('Sucesso', 'Pet excluído com sucesso.');
      navigation.goBack();
    } catch (err) {
      let message = 'Não foi possível excluir o pet.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.centered}>
        <Ionicons color={colors.muted} name="alert-circle-outline" size={48} />
        <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
      </View>
    );
  }

  const species = SPECIES_CONFIG[pet.species] ?? SPECIES_CONFIG[Species.OTHER];
  const sex = SEX_CONFIG[pet.sex];
  const age = calculateAge(pet.birth_date);
  const photoUrl = getPhotoUrl(pet);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: species.backgroundColor }]}>
            <MaterialCommunityIcons color={species.color} name={species.icon} size={48} />
          </View>
        )}
      </View>

      {/* Name + breed */}
      <Text style={styles.name}>{pet.name}</Text>
      {pet.breed ? <Text style={styles.breed}>{pet.breed}</Text> : null}

      {/* Species pill */}
      <View style={[styles.speciesPill, { backgroundColor: species.backgroundColor }]}>
        <MaterialCommunityIcons color={species.color} name={species.icon} size={16} />
        <Text style={[styles.speciesText, { color: species.color }]}>{species.label}</Text>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <InfoRow icon={sex.icon} label="Sexo" value={sex.label} />
        <View style={styles.separator} />
        <InfoRow icon="calendar-outline" label="Idade" value={age} />
        {pet.weight != null ? (
          <>
            <View style={styles.separator} />
            <InfoRow icon="fitness-outline" label="Peso" value={`${pet.weight} kg`} />
          </>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={openEditModal}
          style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primaryDark} name="create-outline" size={18} />
          <Text style={styles.editBtnText}>Editar</Text>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.pressed]}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={18} />
          <Text style={styles.deleteBtnText}>Excluir</Text>
        </Pressable>
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar pet</Text>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Photo picker */}
                <Pressable onPress={handlePickEditImage} style={styles.editPhotoContainer}>
                  {editImageUri ? (
                    <Image source={{ uri: editImageUri }} style={styles.editPhotoImage} />
                  ) : photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.editPhotoImage} />
                  ) : (
                    <View
                      style={[
                        styles.editPhotoPlaceholder,
                        { backgroundColor: species.backgroundColor },
                      ]}
                    >
                      <MaterialCommunityIcons color={species.color} name={species.icon} size={32} />
                    </View>
                  )}
                  <View style={styles.editPhotoBadge}>
                    <Ionicons color={colors.white} name="camera-outline" size={14} />
                  </View>
                </Pressable>

                <View style={styles.field}>
                  <Text style={styles.label}>Nome *</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={(t) => {
                      setEditName(t);
                      if (editFormErrors.name)
                        setEditFormErrors((e) => ({ ...e, name: undefined }));
                    }}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, editFormErrors.name ? styles.inputError : null]}
                    value={editName}
                  />
                  {editFormErrors.name ? (
                    <Text style={styles.fieldError}>{editFormErrors.name}</Text>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Raça</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setEditBreed}
                    placeholder="Raça do pet"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={editBreed}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Data de nascimento</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setEditBirthDate(formatDateInput(t));
                      if (editFormErrors.birthDate)
                        setEditFormErrors((e) => ({ ...e, birthDate: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, editFormErrors.birthDate ? styles.inputError : null]}
                    value={editBirthDate}
                  />
                  {editFormErrors.birthDate ? (
                    <Text style={styles.fieldError}>{editFormErrors.birthDate}</Text>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Peso (kg)</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setEditWeight}
                    placeholder="Ex: 12.5"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={editWeight}
                  />
                </View>

                <Pressable
                  disabled={isSubmitting}
                  onPress={handleEditSubmit}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Salvar alterações</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  photo: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  breed: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  speciesPill: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  speciesText: {
    ...typography.label,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },

  // Action buttons
  actionsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  editBtn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  editBtnText: {
    ...typography.button,
    color: colors.primaryDark,
  },
  deleteBtn: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    ...typography.button,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.82,
  },

  // Edit photo
  editPhotoContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  editPhotoImage: {
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  editPhotoPlaceholder: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  editPhotoBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    bottom: 0,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 24,
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
    maxHeight: '85%',
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
  fieldError: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
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
});
