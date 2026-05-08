import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { ClinicaResponseDto } from '@petcardorg/shared';

import { colors, radii, spacing, typography } from '../../utils/theme';
import * as clinicService from '../../services/clinic.service';
import { ClinicDetailCard } from './ClinicDetailCard';

const RADIUS_OPTIONS = [5, 10, 25, 50];
const SPECIALTY_OPTIONS = [
  'Clínica geral',
  'Emergência 24h',
  'Ortopedia',
  'Dermatologia',
  'Exóticos',
];

const DEFAULT_DELTA = 0.05;

type ScreenState = 'loading' | 'permission_denied' | 'error' | 'empty' | 'success';

export function ClinicSearchScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [state, setState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clinics, setClinics] = useState<ClinicaResponseDto[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicaResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedRadius, setSelectedRadius] = useState(10);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const loadClinics = useCallback(
    async (lat: number, lng: number, radiusKm: number, specialty: string | null) => {
      try {
        const data = await clinicService.findNearbyClinics({
          lat,
          lng,
          radiusKm,
          specialty: specialty ?? undefined,
        });
        setClinics(data);
        setState(data.length === 0 ? 'empty' : 'success');
      } catch {
        setErrorMessage('Não foi possível buscar clínicas próximas.');
        setState('error');
      }
    },
    [],
  );

  const requestLocationAndLoad = useCallback(async () => {
    setState('loading');
    setSelectedClinic(null);
    setErrorMessage('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('permission_denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setUserLocation(coords);
      await loadClinics(coords.lat, coords.lng, selectedRadius, selectedSpecialty);
    } catch {
      setErrorMessage('Não foi possível obter sua localização.');
      setState('error');
    }
  }, [loadClinics, selectedRadius, selectedSpecialty]);

  useEffect(() => {
    requestLocationAndLoad();
  }, []);

  const applyFilters = useCallback(
    async (radiusKm: number, specialty: string | null) => {
      if (!userLocation) return;
      setSelectedClinic(null);
      setIsSearching(true);
      await loadClinics(userLocation.lat, userLocation.lng, radiusKm, specialty);
      setIsSearching(false);
    },
    [userLocation, loadClinics],
  );

  const handleRadiusChange = useCallback(
    (radius: number) => {
      setSelectedRadius(radius);
      applyFilters(radius, selectedSpecialty);
    },
    [applyFilters, selectedSpecialty],
  );

  const handleSpecialtyChange = useCallback(
    (specialty: string | null) => {
      setSelectedSpecialty(specialty);
      applyFilters(selectedRadius, specialty);
    },
    [applyFilters, selectedRadius],
  );

  const handleMarkerPress = useCallback(
    (e: { stopPropagation: () => void }, clinic: ClinicaResponseDto) => {
      e.stopPropagation();
      setSelectedClinic(clinic);
    },
    [],
  );

  const handleDismissCard = useCallback(() => {
    setSelectedClinic(null);
  }, []);

  if (state === 'loading') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Buscando clínicas próximas...</Text>
      </View>
    );
  }

  if (state === 'permission_denied') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.iconCircle}>
          <Ionicons color={colors.warning} name="location-outline" size={40} />
        </View>
        <Text style={styles.stateTitle}>Localização necessária</Text>
        <Text style={styles.stateDescription}>
          Para mostrar clínicas próximas, precisamos acessar sua localização. Habilite a permissão
          nas configurações do dispositivo.
        </Text>
        <Pressable
          onPress={requestLocationAndLoad}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (state === 'error' && !userLocation) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={[styles.iconCircle, styles.iconCircleError]}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={40} />
        </View>
        <Text style={styles.stateTitle}>Ops, algo deu errado</Text>
        <Text style={styles.stateDescription}>{errorMessage}</Text>
        <Pressable
          onPress={requestLocationAndLoad}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.white} name="refresh" size={18} style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const initialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={handleDismissCard}
      >
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            coordinate={{
              latitude: clinic.coordinates.coordinates[1],
              longitude: clinic.coordinates.coordinates[0],
            }}
            onPress={(e) => handleMarkerPress(e, clinic)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="medkit" size={20} color={colors.white} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.filtersContainer, { top: insets.top + spacing.sm }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {RADIUS_OPTIONS.map((radius) => (
            <Pressable
              key={radius}
              onPress={() => handleRadiusChange(radius)}
              style={[styles.chip, selectedRadius === radius && styles.chipActive]}
            >
              <Ionicons
                name="resize-outline"
                size={14}
                color={selectedRadius === radius ? colors.white : colors.text}
              />
              <Text style={[styles.chipText, selectedRadius === radius && styles.chipTextActive]}>
                {radius} km
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <Pressable
            onPress={() => handleSpecialtyChange(null)}
            style={[styles.chip, selectedSpecialty === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedSpecialty === null && styles.chipTextActive]}>
              Todas
            </Text>
          </Pressable>
          {SPECIALTY_OPTIONS.map((spec) => (
            <Pressable
              key={spec}
              onPress={() => handleSpecialtyChange(spec)}
              style={[styles.chip, selectedSpecialty === spec && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSpecialty === spec && styles.chipTextActive]}>
                {spec}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isSearching && (
        <View style={[styles.searchingOverlay, { top: insets.top + spacing.sm + 88 }]}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.searchingText}>Atualizando...</Text>
        </View>
      )}

      {state === 'empty' && !isSearching && (
        <View style={[styles.emptyOverlay, { top: insets.top + spacing.sm + 88 }]}>
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <Text style={styles.emptyText}>Nenhuma clínica encontrada com os filtros atuais</Text>
          </View>
        </View>
      )}

      {state === 'error' && userLocation && !isSearching && (
        <View style={[styles.emptyOverlay, { top: insets.top + spacing.sm + 88 }]}>
          <Pressable
            style={styles.emptyCard}
            onPress={() => applyFilters(selectedRadius, selectedSpecialty)}
          >
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.emptyText}>
              Erro ao buscar clínicas. Toque para tentar novamente
            </Text>
          </Pressable>
        </View>
      )}

      {selectedClinic && (
        <ClinicDetailCard
          clinic={selectedClinic}
          onDismiss={handleDismissCard}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.md,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  iconCircleError: {
    backgroundColor: colors.dangerSoft,
  },
  stateTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  stateDescription: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  retryIcon: {
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
  },
  markerContainer: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  filtersContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  filtersContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    elevation: 3,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
  },
  searchingOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    elevation: 4,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchingText: {
    ...typography.caption,
    color: colors.muted,
  },
  emptyOverlay: {
    alignItems: 'center',
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    elevation: 4,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.muted,
    flex: 1,
  },
});
