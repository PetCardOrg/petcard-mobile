import { DEFAULT_RADIUS, RADIUS_OPTIONS, formatRadius, regionForRadius } from '../radius';

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
  });
});
