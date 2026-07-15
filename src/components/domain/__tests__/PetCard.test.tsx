import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import { renderWithProviders, screen, fireEvent } from '../../../test/renderWithProviders';
import { PetCard } from '../PetCard';

const basePet = {
  id: 'pet-1',
  name: 'Rex',
  species: Species.DOG,
  sex: Sex.MALE,
  breed: 'Labrador',
  birth_date: '2023-05-15',
  photo_url: null,
} as unknown as PetResponseDto;

describe('PetCard', () => {
  it('renderiza nome, raça e rótulo da espécie', () => {
    renderWithProviders(<PetCard pet={basePet} onPress={jest.fn()} />);

    expect(screen.getByText('Rex')).toBeVisible();
    expect(screen.getByText('Labrador')).toBeVisible();
    expect(screen.getByText('Cachorro')).toBeVisible();
  });

  it('expõe rótulo acessível para abrir os detalhes', () => {
    renderWithProviders(<PetCard pet={basePet} onPress={jest.fn()} />);
    expect(screen.getByLabelText('Abrir detalhes de Rex')).toBeTruthy();
  });

  it('não renderiza a raça quando ausente', () => {
    renderWithProviders(<PetCard pet={{ ...basePet, breed: undefined }} onPress={jest.fn()} />);
    expect(screen.queryByText('Labrador')).toBeNull();
  });

  it('dispara onPress com o pet ao tocar no cartão', () => {
    const onPress = jest.fn();
    renderWithProviders(<PetCard pet={basePet} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Abrir detalhes de Rex'));

    expect(onPress).toHaveBeenCalledWith(basePet);
  });
});
