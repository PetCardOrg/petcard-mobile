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

/**
 * Raio, em km, que a região visível está enquadrando. Desconta a mesma folga
 * aplicada em `regionForRadius` — as duas são inversas, então enquadrar um raio
 * e lê-lo de volta devolve o mesmo valor (sem isso, arrastar o mapa promovia o
 * raio para a faixa seguinte sozinho).
 */
export function radiusFromRegion(region: Region): number {
  const halfHeightKm = (region.latitudeDelta / 2) * KM_PER_DEGREE;
  const halfWidthKm =
    (region.longitudeDelta / 2) * KM_PER_DEGREE * Math.cos((region.latitude * Math.PI) / 180);

  return Math.min(halfHeightKm, halfWidthKm) / VIEWPORT_PADDING;
}

/** Menor opção que cobre o raio informado; satura na maior. */
export function snapRadiusToOption(km: number): number {
  return RADIUS_OPTIONS.find((option) => option >= km) ?? RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
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
