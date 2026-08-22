import { Text } from 'react-native';
import { Sex, Species } from '@petcardorg/shared';
import type { CarteiraDigitalResponseDto } from '@petcardorg/shared';

import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/renderWithProviders';
import { SelectedPetProvider, useSelectedPet } from '../../../contexts/SelectedPetContext';
import { DigitalWalletScreen } from '../DigitalWalletScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const { useEffect } = jest.requireActual('react') as typeof import('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => void | (() => void)) => useEffect(cb, [cb]),
  };
});

const mockGetDigitalWallet = jest.fn();

jest.mock('../../../services', () => ({
  cardService: {
    getDigitalWallet: (petId: string) => mockGetDigitalWallet(petId) as unknown,
  },
}));

const carteira = {
  pet_id: 'p1',
  pet_name: 'Rex',
  species: Species.DOG,
  sex: Sex.MALE,
  birth_date: '2021-05-12',
  weight: 28.5,
  qr_code_url: null,
  public_url: null,
  tutor_name: 'Ana',
  vaccines_count: 2,
  upcoming_vaccines_count: 1,
  dewormings_count: 1,
  upcoming_dewormings_count: 0,
  medications_count: 3,
  active_medications_count: 1,
} as unknown as CarteiraDigitalResponseDto;

/** Espia o pet que a aba de medicações passou a lembrar. */
function EspiaMedicacoes() {
  const { selectedPetId } = useSelectedPet('medicacoes');
  return <Text testID="pet-lembrado-medicacoes">{selectedPetId ?? '(nenhum)'}</Text>;
}

function renderCarteira() {
  const route = { params: { petId: 'p1', petName: 'Rex' } };
  return renderWithProviders(
    <SelectedPetProvider>
      <DigitalWalletScreen route={route as never} navigation={{} as never} />
      <EspiaMedicacoes />
    </SelectedPetProvider>,
  );
}

describe('DigitalWalletScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGetDigitalWallet.mockReset();
    mockGetDigitalWallet.mockResolvedValue(carteira);
  });

  it('abre a aba de saúde no pet da carteira ao tocar no resumo', async () => {
    renderCarteira();
    await screen.findByText('Rex');

    fireEvent.press(screen.getByLabelText('Ver registros de Medicações deste pet'));

    // As duas coisas juntas são a correção: sem escolher o pet, o tutor sai do
    // resumo de um pet e cai na tela de escolher pet.
    await waitFor(() =>
      expect(screen.getByTestId('pet-lembrado-medicacoes')).toHaveTextContent('p1'),
    );
    expect(mockNavigate).toHaveBeenCalledWith('Health', {
      abrir: expect.objectContaining({ aba: 'medications' }),
    });
  });
});
