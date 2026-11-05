import type { Region } from 'react-native-maps';

/** Raios oferecidos na busca, em km. */
export const RADIUS_OPTIONS = [0.5, 1, 2, 5];

export const DEFAULT_RADIUS = 2;

const KM_PER_DEGREE = 111.32;

/** Folga para o raio não encostar na borda da tela. */
const VIEWPORT_PADDING = 1.3;

/** 0.5 -> "500 m"; 2 -> "2 km". */
export function formatRadius(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
}

/** Região que enquadra o raio informado ao redor do ponto. */
export function regionForRadius(lat: number, lng: number, radiusKm: number): Region {
  const delta = ((radiusKm * 2) / KM_PER_DEGREE) * VIEWPORT_PADDING;

  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}
