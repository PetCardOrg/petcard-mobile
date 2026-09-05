import { useState } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../../test/renderWithProviders';
import * as clinicService from '../../../services/clinic.service';
import { DEBOUNCE_MS } from '../../../hooks/usePlaceAutocomplete';
import { PlaceAutocompleteInput } from '../PlaceAutocompleteInput';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'sessao-fixa' }));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  getLastKnownPositionAsync: jest.fn(),
}));

const autocompleteSpy = jest.spyOn(clinicService, 'autocompletePlaces');

const SUGESTAO = {
  placeId: 'p1',
  mainText: 'Petshop Amigo Fiel',
  secondaryText: 'Rua A, 100 - Fortaleza',
  fullText: 'Petshop Amigo Fiel, Rua A, 100 - Fortaleza',
};

/** Espelha o uso real: a tela é dona do texto, o campo só informa mudanças. */
function CampoControlado() {
  const [local, setLocal] = useState('');
  return <PlaceAutocompleteInput onChangeText={setLocal} value={local} />;
}

function digitar(texto: string) {
  fireEvent.changeText(screen.getByTestId('place-autocomplete-input'), texto);
}

/** Vence o debounce sem esperar de verdade. */
async function avancarDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(DEBOUNCE_MS);
  });
}

describe('PlaceAutocompleteInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    autocompleteSpy.mockResolvedValue([SUGESTAO]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('não consulta o Google com menos de 3 caracteres', async () => {
    renderWithProviders(<CampoControlado />);

    digitar('pe');
    await avancarDebounce();

    expect(autocompleteSpy).not.toHaveBeenCalled();
  });

  it('agrupa as teclas numa só chamada e busca o último termo digitado', async () => {
    renderWithProviders(<CampoControlado />);

    digitar('pet');
    digitar('pets');
    digitar('petsh');
    await avancarDebounce();

    expect(autocompleteSpy).toHaveBeenCalledTimes(1);
    expect(autocompleteSpy.mock.calls[0][0].input).toBe('petsh');
  });

  it('escolher a sugestão preenche o campo com o texto completo e fecha a lista', async () => {
    renderWithProviders(<CampoControlado />);

    digitar('petshop');
    await avancarDebounce();
    await waitFor(() => expect(screen.getByTestId('place-suggestion-p1')).toBeTruthy());

    fireEvent.press(screen.getByTestId('place-suggestion-p1'));

    expect(screen.getByTestId('place-autocomplete-input').props.value).toBe(SUGESTAO.fullText);
    expect(screen.queryByTestId('place-autocomplete-suggestions')).toBeNull();
  });

  it('mantém o texto livre quando o Google não conhece o local', async () => {
    autocompleteSpy.mockResolvedValue([]);
    renderWithProviders(<CampoControlado />);

    digitar('clinica do seu ze');
    await avancarDebounce();

    await waitFor(() => expect(screen.getByText(/digitar o endereço mesmo assim/i)).toBeTruthy());
    expect(screen.getByTestId('place-autocomplete-input').props.value).toBe('clinica do seu ze');
  });

  it('reaproveita o mesmo sessionToken enquanto o tutor não escolhe um local', async () => {
    renderWithProviders(<CampoControlado />);

    digitar('petshop');
    await avancarDebounce();
    digitar('petshop amigo');
    await avancarDebounce();

    const [primeira, segunda] = autocompleteSpy.mock.calls;
    expect(primeira[0].sessionToken).toBe('sessao-fixa');
    expect(segunda[0].sessionToken).toBe('sessao-fixa');
  });
});
