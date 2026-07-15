import { Sex, Species } from '@petcardorg/shared';

import { getPhotoUrl, SEX_CONFIG, SPECIES_CONFIG } from '../petConfig';

describe('getPhotoUrl', () => {
  it('retorna a URL quando é https válida', () => {
    expect(getPhotoUrl({ photo_url: 'https://cdn.petcard.app/rex.jpg' })).toBe(
      'https://cdn.petcard.app/rex.jpg',
    );
  });

  it('rejeita URL não-https (evita mixed content)', () => {
    expect(getPhotoUrl({ photo_url: 'http://cdn.petcard.app/rex.jpg' })).toBeNull();
  });

  it('retorna null para valor vazio ou nulo', () => {
    expect(getPhotoUrl({ photo_url: '' })).toBeNull();
    expect(getPhotoUrl({ photo_url: '   ' })).toBeNull();
    expect(getPhotoUrl({ photo_url: null as unknown as string })).toBeNull();
  });
});

describe('configs de espécie e sexo', () => {
  it('cobre todas as espécies do enum', () => {
    for (const species of Object.values(Species)) {
      expect(SPECIES_CONFIG[species]).toBeDefined();
      expect(SPECIES_CONFIG[species].label).toBeTruthy();
    }
  });

  it('cobre ambos os sexos do enum', () => {
    expect(SEX_CONFIG[Sex.MALE].label).toBe('Macho');
    expect(SEX_CONFIG[Sex.FEMALE].label).toBe('Fêmea');
  });
});
