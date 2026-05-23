import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import type { PlacesClinicResponseDto } from '@petcardorg/shared';

import { colors, radii, spacing, typography } from '../../utils/theme';
import * as clinicService from '../../services/clinic.service';
import { useAuth } from '../../contexts/AuthContext';
import { ClinicDetailCard } from './ClinicDetailCard';
import type { MainTabParamList } from '../../navigation/types';

const RADIUS_OPTIONS = [5, 10, 25, 50];

const DEFAULT_DELTA = 0.05;

type ScreenState = 'loading' | 'permission_denied' | 'error' | 'empty' | 'success';

export function ClinicSearchScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<MaterialTopTabNavigationProp<MainTabParamList>>();
  const mapRef = useRef<MapView>(null);

  const [state, setState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clinics, setClinics] = useState<PlacesClinicResponseDto[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<PlacesClinicResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedRadius, setSelectedRadius] = useState(10);
  const [openNowFilter, setOpenNowFilter] = useState(false);

  // Schedule prompt state
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [calledClinic, setCalledClinic] = useState<PlacesClinicResponseDto | null>(null);
  const waitingForReturn = useRef(false);

  // Detect when user returns from phone dialer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && waitingForReturn.current) {
        waitingForReturn.current = false;
        setShowSchedulePrompt(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleCallMade = useCallback(() => {
    if (selectedClinic) {
      setCalledClinic(selectedClinic);
      waitingForReturn.current = true;
    }
  }, [selectedClinic]);

  function handleScheduleAppointment() {
    if (!calledClinic) return;
    setShowSchedulePrompt(false);
    navigation.navigate('Appointments', {
      prefill: {
        location: calledClinic.address ?? calledClinic.name,
        _ts: Date.now(),
      },
    });
  }

  function dismissSchedulePrompt() {
    setShowSchedulePrompt(false);
    setCalledClinic(null);
  }

  const loadClinics = useCallback(
    async (lat: number, lng: number, radiusKm: number, openNow: boolean) => {
      try {
        const data = await clinicService.findNearbyPlaces({
          lat,
          lng,
          radiusKm,
          openNow: openNow || undefined,
        });
        setClinics(data);
        setState(data.length === 0 ? 'empty' : 'success');
      } catch {
        setErrorMessage(t('clinics.errorLoading'));
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
      await loadClinics(coords.lat, coords.lng, selectedRadius, openNowFilter);
    } catch {
      setErrorMessage(t('clinics.errorLocation'));
      setState('error');
    }
  }, [loadClinics, selectedRadius, openNowFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      requestLocationAndLoad();
    }
  }, [isAuthenticated]);

  const applyFilters = useCallback(
    async (radiusKm: number, openNow: boolean) => {
      if (!userLocation) return;
      setSelectedClinic(null);
      setIsSearching(true);
      await loadClinics(userLocation.lat, userLocation.lng, radiusKm, openNow);
      setIsSearching(false);
    },
    [userLocation, loadClinics],
  );

  const handleRadiusChange = useCallback(
    (radius: number) => {
      setSelectedRadius(radius);
      applyFilters(radius, openNowFilter);
    },
    [applyFilters, openNowFilter],
  );

  const handleOpenNowToggle = useCallback(() => {
    const newValue = !openNowFilter;
    setOpenNowFilter(newValue);
    applyFilters(selectedRadius, newValue);
  }, [applyFilters, selectedRadius, openNowFilter]);

  const handleMarkerPress = useCallback(
    (e: { stopPropagation: () => void }, clinic: PlacesClinicResponseDto) => {
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
        <Text style={styles.loadingText}>{t('clinics.loading')}</Text>
      </View>
    );
  }

  if (state === 'permission_denied') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.iconCircle}>
          <Ionicons color={colors.warning} name="location-outline" size={40} />
        </View>
        <Text style={styles.stateTitle}>{t('clinics.permissionTitle')}</Text>
        <Text style={styles.stateDescription}>{t('clinics.permissionDescription')}</Text>
        <Pressable
          onPress={requestLocationAndLoad}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryButtonText}>{t('clinics.retry')}</Text>
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
        <Text style={styles.stateTitle}>{t('clinics.errorTitle')}</Text>
        <Text style={styles.stateDescription}>{errorMessage}</Text>
        <Pressable
          onPress={requestLocationAndLoad}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.white} name="refresh" size={18} style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>{t('clinics.retry')}</Text>
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
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={handleDismissCard}
      >
        {clinics.map((clinic) => (
          <Marker
            key={clinic.placeId}
            coordinate={{
              latitude: clinic.coordinates.lat,
              longitude: clinic.coordinates.lng,
            }}
            onPress={(e) => handleMarkerPress(e, clinic)}
          >
            <View style={[styles.markerContainer, clinic.openNow === false && styles.markerClosed]}>
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

          <View style={styles.chipDivider} />

          <Pressable
            onPress={handleOpenNowToggle}
            style={[styles.chip, openNowFilter && styles.chipActive]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={openNowFilter ? colors.white : colors.text}
            />
            <Text style={[styles.chipText, openNowFilter && styles.chipTextActive]}>
              {t('clinics.openNow')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {isSearching && (
        <View style={[styles.searchingOverlay, { top: insets.top + spacing.sm + 52 }]}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.searchingText}>{t('clinics.updating')}</Text>
        </View>
      )}

      {state === 'empty' && !isSearching && (
        <View style={[styles.emptyOverlay, { top: insets.top + spacing.sm + 52 }]}>
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <Text style={styles.emptyText}>{t('clinics.emptyResult')}</Text>
          </View>
        </View>
      )}

      {state === 'error' && userLocation && !isSearching && (
        <View style={[styles.emptyOverlay, { top: insets.top + spacing.sm + 52 }]}>
          <Pressable
            style={styles.emptyCard}
            onPress={() => applyFilters(selectedRadius, openNowFilter)}
          >
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.emptyText}>{t('clinics.errorRetry')}</Text>
          </Pressable>
        </View>
      )}

      {selectedClinic && (
        <ClinicDetailCard
          clinic={selectedClinic}
          onDismiss={handleDismissCard}
          onCallMade={handleCallMade}
          bottomInset={insets.bottom}
        />
      )}

      {showSchedulePrompt && (
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptIconCircle}>
              <Ionicons name="calendar" size={32} color={colors.primaryDark} />
            </View>
            <Text style={styles.promptTitle}>{t('clinics.detail.appointmentScheduled')}</Text>
            <Text style={styles.promptSubtitle}>{calledClinic?.name}</Text>
            <Pressable
              onPress={handleScheduleAppointment}
              style={({ pressed }) => [styles.promptButton, pressed && styles.pressed]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <Text style={styles.promptButtonText}>{t('clinics.detail.addToSchedule')}</Text>
            </Pressable>
            <Pressable
              onPress={dismissSchedulePrompt}
              style={({ pressed }) => [styles.promptDismiss, pressed && styles.pressed]}
            >
              <Text style={styles.promptDismissText}>{t('clinics.detail.notNow')}</Text>
            </Pressable>
          </View>
        </View>
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
  markerClosed: {
    backgroundColor: colors.muted,
  },
  filtersContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  filtersContent: {
    alignItems: 'center',
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
  chipDivider: {
    backgroundColor: colors.border,
    height: 20,
    width: 1,
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

  // Schedule prompt overlay
  promptOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  promptCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
  },
  promptIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 72,
  },
  promptTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  promptSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  promptButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    width: '100%',
  },
  promptButtonText: {
    ...typography.button,
    color: colors.white,
  },
  promptDismiss: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  promptDismissText: {
    ...typography.button,
    color: colors.muted,
  },
});
