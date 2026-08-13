import {
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  formatRadius,
  radiusFromRegion,
  regionForRadius,
  snapRadiusToOption,
} from '../radius';

describe('radius', () => {
  it('oferece as faixas curtas e usa uma delas como padrão', () => {
    expect(RADIUS_OPTIONS).toEqual([0.5, 1, 2, 5]);
    expect(RADIUS_OPTIONS).toContain(DEFAULT_RADIUS);
  });

  describe('formatRadius', () => {
    it('mostra metros abaixo de 1 km', () => {
      expect(formatRadius(0.5)).toBe('500 m');
    });

    it('mostra km a partir de 1', () => {
      expect(formatRadius(1)).toBe('1 km');
      expect(formatRadius(5)).toBe('5 km');
    });
  });

  describe('snapRadiusToOption', () => {
    it('encaixa na menor opção que cobre o raio', () => {
      expect(snapRadiusToOption(0.3)).toBe(0.5);
      expect(snapRadiusToOption(1.4)).toBe(2);
    });

    it('mantém o valor quando ele já é uma opção', () => {
      expect(snapRadiusToOption(1)).toBe(1);
    });

    it('satura na maior opção', () => {
      expect(snapRadiusToOption(80)).toBe(5);
    });
  });

  describe('radiusFromRegion', () => {
    it('usa a menor dimensão visível', () => {
      const largura = radiusFromRegion({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 1,
        longitudeDelta: 0.02,
      });

      // 0.01 grau de longitude no equador ~ 1,11 km, menos a folga de 1,3
      expect(largura).toBeCloseTo(1.11 / 1.3, 2);
    });

    it('cresce conforme o mapa abre', () => {
      const perto = radiusFromRegion({
        latitude: -3.73,
        longitude: -38.52,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      const longe = radiusFromRegion({
        latitude: -3.73,
        longitude: -38.52,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });

      expect(longe).toBeGreaterThan(perto);
    });
  });

  describe('regionForRadius', () => {
    it('centraliza no ponto informado', () => {
      const region = regionForRadius(-3.73, -38.52, 1);

      expect(region.latitude).toBe(-3.73);
      expect(region.longitude).toBe(-38.52);
    });

    it('abre a viewport proporcionalmente ao raio', () => {
      const pequena = regionForRadius(-3.73, -38.52, 0.5);
      const grande = regionForRadius(-3.73, -38.52, 5);

      expect(grande.latitudeDelta).toBeGreaterThan(pequena.latitudeDelta);
    });

    it('é inversa de radiusFromRegion — ida e volta não muda a faixa', () => {
      RADIUS_OPTIONS.forEach((radius) => {
        const lido = radiusFromRegion(regionForRadius(0, 0, radius));

        expect(lido).toBeCloseTo(radius, 5);
        expect(snapRadiusToOption(lido)).toBe(radius);
      });
    });
  });
});
