import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import { renderWithProviders, screen, fireEvent } from '../../test/renderWithProviders';
import { ErrorState } from '../ui/ErrorState';
import { FAB } from '../ui/FAB';
import { PetHeader } from '../domain/PetHeader';
import { PetSelector } from '../domain/PetSelector';

const pets = [
  { id: 'p1', name: 'Rex', species: Species.DOG, sex: Sex.MALE, breed: 'Labrador' },
  { id: 'p2', name: 'Mia', species: Species.CAT, sex: Sex.FEMALE, breed: undefined },
] as unknown as PetResponseDto[];

describe('ErrorState', () => {
  it('mostra mensagem e usa título padrão traduzido', () => {
    renderWithProviders(<ErrorState message="Falha ao carregar." />);
    expect(screen.getByText('Falha ao carregar.')).toBeVisible();
  });

  it('renderiza botão de retry só quando onRetry é passado', () => {
    const onRetry = jest.fn();
    const { rerender } = renderWithProviders(<ErrorState message="Erro" />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<ErrorState message="Erro" onRetry={onRetry} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('FAB', () => {
  it('usa rótulo acessível padrão e dispara onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<FAB onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Adicionar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('aceita rótulo acessível customizado', () => {
    renderWithProviders(<FAB onPress={jest.fn()} accessibilityLabel="Adicionar pet" />);
    expect(screen.getByLabelText('Adicionar pet')).toBeTruthy();
  });
});

describe('PetHeader', () => {
  it('mostra o nome do pet e volta ao tocar', () => {
    const onBack = jest.fn();
    renderWithProviders(<PetHeader petName="Rex" onBack={onBack} />);

    expect(screen.getByText('Rex')).toBeVisible();
    fireEvent.press(screen.getByText('Trocar'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('PetSelector', () => {
  it('mostra estado vazio quando não há pets', () => {
    renderWithProviders(
      <PetSelector
        pets={[]}
        isLoading={false}
        onSelectPet={jest.fn()}
        subtitle="Escolha um pet"
        emptyDescription="Cadastre um pet primeiro."
      />,
    );
    expect(screen.getByText('Cadastre um pet primeiro.')).toBeVisible();
  });

  it('lista os pets e seleciona ao tocar', () => {
    const onSelect = jest.fn();
    renderWithProviders(
      <PetSelector
        pets={pets}
        isLoading={false}
        onSelectPet={onSelect}
        subtitle="Escolha um pet"
        emptyDescription="..."
      />,
    );

    expect(screen.getByText('Rex')).toBeVisible();
    expect(screen.getByText('Mia')).toBeVisible();

    fireEvent.press(screen.getByText('Rex'));
    expect(onSelect).toHaveBeenCalledWith(pets[0]);
  });
});
