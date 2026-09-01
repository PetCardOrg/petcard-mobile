import { renderWithProviders, screen, fireEvent } from '../../test/renderWithProviders';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('começa oculto (pontinhos) e revela ao tocar no olho', () => {
    renderWithProviders(<PasswordInput placeholder="Sua senha" value="s3gr3d0" />);

    const field = screen.getByPlaceholderText('Sua senha');
    expect(field.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByLabelText('Mostrar senha'));
    expect(field.props.secureTextEntry).toBe(false);

    fireEvent.press(screen.getByLabelText('Ocultar senha'));
    expect(field.props.secureTextEntry).toBe(true);
  });

  it('encaminha onChangeText', () => {
    const onChangeText = jest.fn();
    renderWithProviders(
      <PasswordInput placeholder="Sua senha" value="" onChangeText={onChangeText} />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Sua senha'), 'nova');
    expect(onChangeText).toHaveBeenCalledWith('nova');
  });
});
