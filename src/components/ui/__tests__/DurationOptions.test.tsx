import { fireEvent, render, screen } from '@testing-library/react-native';

import { DURATION_OPTIONS_MINUTES, DurationOptions } from '../DurationOptions';

describe('DurationOptions', () => {
  it('mostra só as opções permitidas: 15, 30, 60, 90 e 120 minutos', () => {
    render(<DurationOptions onChange={jest.fn()} value={60} />);

    for (const minutos of DURATION_OPTIONS_MINUTES) {
      expect(screen.getByTestId(`duration-option-${minutos}`)).toBeTruthy();
    }
  });

  it('marca como selecionado só o botão do valor atual', () => {
    render(<DurationOptions onChange={jest.fn()} value={90} />);

    expect(screen.getByTestId('duration-option-90').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('duration-option-30').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('chama onChange com o valor do botão tocado', () => {
    const onChange = jest.fn();
    render(<DurationOptions onChange={onChange} value={60} />);

    fireEvent.press(screen.getByTestId('duration-option-120'));

    expect(onChange).toHaveBeenCalledWith(120);
  });
});
