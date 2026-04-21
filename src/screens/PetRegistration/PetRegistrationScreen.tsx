import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Species, Sex } from '@petcardorg/shared';
import type { CreatePetRequest } from '@petcardorg/shared';
import { useNavigation } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';

import { petService, uploadService } from '../../services';
import type { MainTabParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PetFormData = Omit<CreatePetRequest, 'photo_url'>;

const SPECIES_OPTIONS: { label: string; value: Species }[] = [
  { label: 'Cachorro', value: Species.DOG },
  { label: 'Gato', value: Species.CAT },
  { label: 'Ave', value: Species.BIRD },
  { label: 'Outro', value: Species.OTHER },
];

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: 'Macho', value: Sex.MALE },
  { label: 'Fêmea', value: Sex.FEMALE },
];

const BREED_SUGGESTIONS: Record<Species, string[]> = {
  [Species.DOG]: [
    'SRD (Vira-lata)',
    'Labrador Retriever',
    'Golden Retriever',
    'Bulldog',
    'Poodle',
    'Pastor Alemão',
    'Shih Tzu',
    'Pinscher',
    'Yorkshire',
    'Rottweiler',
    'Husky Siberiano',
    'Border Collie',
    'Pit Bull',
    'Dachshund',
    'Beagle',
  ],
  [Species.CAT]: [
    'SRD (Vira-lata)',
    'Siamês',
    'Persa',
    'Maine Coon',
    'Ragdoll',
    'Bengal',
    'Sphynx',
    'British Shorthair',
    'Angorá',
    'Scottish Fold',
  ],
  [Species.BIRD]: [
    'Calopsita',
    'Periquito',
    'Canário',
    'Papagaio',
    'Agapornis',
    'Cacatua',
    'Mandarim',
  ],
  [Species.OTHER]: [],
};

function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function parseDate(text: string): string | undefined {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (isNaN(date.getTime())) return undefined;
  if (date.getDate() !== Number(day) || date.getMonth() + 1 !== Number(month)) return undefined;
  return `${year}-${month}-${day}`;
}

export function PetRegistrationScreen() {
  const navigation = useNavigation<MaterialTopTabNavigationProp<MainTabParamList>>();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [customSpecies, setCustomSpecies] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [customBreed, setCustomBreed] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    species?: string;
    customSpecies?: string;
    sex?: string;
    birthDate?: string;
  }>({});

  const breedSuggestions = species ? BREED_SUGGESTIONS[species] : [];

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!species) newErrors.species = 'Espécie é obrigatória';
    if (species === Species.OTHER && !customSpecies.trim()) {
      newErrors.customSpecies = 'Informe qual é o animal';
    }
    if (!sex) newErrors.sex = 'Sexo é obrigatório';
    if (birthDate.length > 0 && !parseDate(birthDate)) {
      newErrors.birthDate = 'Data inválida. Use DD/MM/AAAA';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePickImage() {
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
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: PetFormData = {
        name: name.trim(),
        species: species!,
        sex: sex!,
      };

      if (birthDate) {
        const parsed = parseDate(birthDate);
        if (parsed) payload.birth_date = parsed;
      }
      if (species === Species.OTHER && customSpecies.trim()) {
        payload.breed = breed.trim()
          ? `${customSpecies.trim()} - ${breed.trim()}`
          : customSpecies.trim();
      } else if (breed.trim()) {
        payload.breed = breed.trim();
      }
      if (weight.trim()) {
        const num = parseFloat(weight.replace(',', '.'));
        if (!isNaN(num) && num > 0) payload.weight = num;
      }

      let photoUrl: string | undefined;
      if (imageUri) {
        photoUrl = await uploadService.uploadImage(imageUri, 'pets');
      }

      await petService.createPet({
        ...payload,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });

      Alert.alert('Sucesso', 'Pet cadastrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      let message = 'Não foi possível cadastrar o pet. Tente novamente.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Ionicons color={colors.white} name="paw" size={20} />
            </View>
            <Text style={styles.title}>Cadastrar Pet</Text>
            <Text style={styles.subtitle}>Preencha os dados do seu pet.</Text>
          </View>

          {/* Photo */}
          <Pressable onPress={handlePickImage} style={styles.photoContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons color={colors.muted} name="camera-outline" size={32} />
                <Text style={styles.photoText}>Adicionar foto</Text>
              </View>
            )}
          </Pressable>

          {/* Nome */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="Ex: Rex, Luna, Pipoca..."
              placeholderTextColor={colors.muted}
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={name}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Espécie */}
          <View style={styles.field}>
            <Text style={styles.label}>Espécie *</Text>
            <View style={styles.chipRow}>
              {SPECIES_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setSpecies(opt.value);
                    setBreed('');
                    setCustomBreed(false);
                    if (opt.value !== Species.OTHER) setCustomSpecies('');
                    if (errors.species)
                      setErrors((e) => ({ ...e, species: undefined, customSpecies: undefined }));
                  }}
                  style={[styles.chip, species === opt.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, species === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.species ? <Text style={styles.errorText}>{errors.species}</Text> : null}
          </View>

          {/* Qual animal (quando Outro) */}
          {species === Species.OTHER ? (
            <View style={styles.field}>
              <Text style={styles.label}>Qual animal? *</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={(t) => {
                  setCustomSpecies(t);
                  if (errors.customSpecies) setErrors((e) => ({ ...e, customSpecies: undefined }));
                }}
                placeholder="Ex: Coelho, Hamster, Tartaruga..."
                placeholderTextColor={colors.muted}
                style={[styles.input, errors.customSpecies ? styles.inputError : null]}
                value={customSpecies}
              />
              {errors.customSpecies ? (
                <Text style={styles.errorText}>{errors.customSpecies}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Raça */}
          <View style={styles.field}>
            <Text style={styles.label}>Raça</Text>
            {breedSuggestions.length > 0 && !customBreed ? (
              <>
                <Pressable onPress={() => setBreedDropdownOpen(true)} style={styles.dropdown}>
                  <Text style={breed ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {breed || 'Selecione a raça...'}
                  </Text>
                  <Ionicons color={colors.muted} name="chevron-down" size={20} />
                </Pressable>

                <Modal
                  animationType="slide"
                  transparent
                  visible={breedDropdownOpen}
                  onRequestClose={() => setBreedDropdownOpen(false)}
                >
                  <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setBreedDropdownOpen(false)}
                  >
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Selecione a raça</Text>
                      <FlatList
                        data={[...breedSuggestions, 'Outra (digitar)']}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <Pressable
                            onPress={() => {
                              if (item === 'Outra (digitar)') {
                                setBreed('');
                                setCustomBreed(true);
                              } else {
                                setBreed(item);
                                setCustomBreed(false);
                              }
                              setBreedDropdownOpen(false);
                            }}
                            style={[styles.modalItem, breed === item && styles.modalItemSelected]}
                          >
                            <Text
                              style={[
                                styles.modalItemText,
                                breed === item && styles.modalItemTextSelected,
                              ]}
                            >
                              {item}
                            </Text>
                          </Pressable>
                        )}
                      />
                    </View>
                  </Pressable>
                </Modal>
              </>
            ) : (
              <>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setBreed}
                  placeholder={
                    species === Species.OTHER ? 'Ex: Angorá, Holland Lop...' : 'Digite a raça...'
                  }
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={breed}
                />
                {breedSuggestions.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      setCustomBreed(false);
                      setBreed('');
                    }}
                  >
                    <Text style={styles.backToListText}>Voltar para a lista</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          {/* Sexo */}
          <View style={styles.field}>
            <Text style={styles.label}>Sexo *</Text>
            <View style={styles.chipRow}>
              {SEX_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setSex(opt.value);
                    if (errors.sex) setErrors((e) => ({ ...e, sex: undefined }));
                  }}
                  style={[styles.chip, sex === opt.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, sex === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.sex ? <Text style={styles.errorText}>{errors.sex}</Text> : null}
          </View>

          {/* Data de nascimento */}
          <View style={styles.field}>
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(t) => {
                setBirthDate(formatDateInput(t));
                if (errors.birthDate) setErrors((e) => ({ ...e, birthDate: undefined }));
              }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.muted}
              style={[styles.input, errors.birthDate ? styles.inputError : null]}
              value={birthDate}
            />
            {errors.birthDate ? <Text style={styles.errorText}>{errors.birthDate}</Text> : null}
          </View>

          {/* Peso */}
          <View style={styles.field}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setWeight}
              placeholder="Ex: 12.5"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={weight}
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
              <Text style={styles.submitButtonText}>Cadastrar pet</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + 40,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
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
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  photoContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.border,
    borderRadius: 60,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 120,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    width: 120,
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoText: {
    ...typography.caption,
    color: colors.muted,
  },
  photoImage: {
    height: 120,
    width: 120,
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
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dropdown: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text,
  },
  dropdownPlaceholder: {
    ...typography.body,
    color: colors.muted,
  },
  backToListText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  modalItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalItemTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.button,
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginTop: spacing.lg,
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
