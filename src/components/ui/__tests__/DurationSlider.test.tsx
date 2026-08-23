import { fireEvent, render, screen } from '@testing-library/react-native';

import { DurationSlider, fillRatio, minutesFromPosition } from '../DurationSlider';

describe('minutesFromPosition', () => {
  const MIN = 15;
  const MAX = 180;
  const PASSO = 15;
  const LARGURA = 330;

  it('mapeia as pontas da trilha no mínimo e no máximo', () => {
    expect(minutesFromPosition(0, LARGURA, MIN, MAX, PASSO)).toBe(MIN);
    expect(minutesFromPosition(LARGURA, LARGURA, MIN, MAX, PASSO)).toBe(MAX);
  });

  it('encaixa no passo mais próximo em vez de devolver valor quebrado', () => {
    // Agendamento de 67 minutos não existe na agenda de ninguém.
    const meio = minutesFromPosition(LARGURA / 2, LARGURA, MIN, MAX, PASSO);
    expect(meio % PASSO).toBe(0);
    expect(meio).toBe(105);
  });

  it('não deixa o arrasto passar das pontas', () => {
    expect(minutesFromPosition(-500, LARGURA, MIN, MAX, PASSO)).toBe(MIN);
    expect(minutesFromPosition(9999, LARGURA, MIN, MAX, PASSO)).toBe(MAX);
  });

  it('devolve o mínimo enquanto a trilha ainda não foi medida', () => {
    // Primeiro render, antes do onLayout: dividir por zero daria NaN e o
    // valor viraria "NaNmin" na tela.
    expect(minutesFromPosition(100, 0, MIN, MAX, PASSO)).toBe(MIN);
  });

  it('alcança os presets que os chips ofereciam', () => {
    const alcancaveis = [];
    for (let x = 0; x <= LARGURA; x++) {
      alcancaveis.push(minutesFromPosition(x, LARGURA, MIN, MAX, PASSO));
    }
    for (const preset of [30, 45, 60, 90, 120]) {
      expect(alcancaveis).toContain(preset);
    }
  });
});

describe('fillRatio', () => {
  it('vai de 0 a 1 conforme o valor caminha na faixa', () => {
    expect(fillRatio(15, 15, 180)).toBe(0);
    expect(fillRatio(180, 15, 180)).toBe(1);
    expect(fillRatio(97.5, 15, 180)).toBeCloseTo(0.5);
  });

  it('não estoura quando o valor está fora da faixa', () => {
    expect(fillRatio(500, 15, 180)).toBe(1);
    expect(fillRatio(0, 15, 180)).toBe(0);
  });
});

describe('DurationSlider', () => {
  it('mostra o valor atual em minutos', () => {
    render(<DurationSlider onChange={jest.fn()} value={60} />);

    expect(screen.getByText('60min')).toBeTruthy();
  });

  it('anuncia a faixa e o valor para leitor de tela', () => {
    render(<DurationSlider onChange={jest.fn()} value={45} />);

    const slider = screen.getByTestId('duration-slider');
    expect(slider.props.accessibilityValue).toEqual({
      max: 180,
      min: 15,
      now: 45,
      text: '45 minutos',
    });
  });

  it('aumenta e diminui um passo pelas ações de acessibilidade', () => {
    const onChange = jest.fn();
    render(<DurationSlider onChange={onChange} value={60} />);
    const slider = screen.getByTestId('duration-slider');

    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).toHaveBeenLastCalledWith(75);

    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onChange).toHaveBeenLastCalledWith(45);
  });

  it('não passa do máximo nem do mínimo pelas ações de acessibilidade', () => {
    const onChange = jest.fn();
    const { rerender } = render(<DurationSlider onChange={onChange} value={180} />);
    const slider = screen.getByTestId('duration-slider');

    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).toHaveBeenLastCalledWith(180);

    rerender(<DurationSlider onChange={onChange} value={15} />);
    fireEvent(screen.getByTestId('duration-slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onChange).toHaveBeenLastCalledWith(15);
  });
});
