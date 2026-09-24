import { renderWithProviders, screen } from '../../test/renderWithProviders';
import { PasswordRulesChecklist } from '../PasswordRulesChecklist';

// O mock de @expo/vector-icons (jest.setup.ts) renderiza o ícone como texto
// "Ionicons:<name>", então dá pra contar quantas regras estão cumpridas.
const met = () => screen.queryAllByText('Ionicons:checkmark-circle').length;
const unmet = () => screen.queryAllByText('Ionicons:ellipse-outline').length;

describe('PasswordRulesChecklist', () => {
  it('começa com as quatro regras não cumpridas', () => {
    renderWithProviders(<PasswordRulesChecklist password="" />);

    expect(met()).toBe(0);
    expect(unmet()).toBe(4);
    expect(screen.getByText('Pelo menos 8 caracteres')).toBeVisible();
  });

  it('marca só as regras que a senha atual cumpre', () => {
    renderWithProviders(<PasswordRulesChecklist password="Senha1" />);

    // maiúscula + número cumpridos; comprimento e caractere especial não
    expect(met()).toBe(2);
    expect(unmet()).toBe(2);
  });

  it('marca todas quando a senha é forte', () => {
    renderWithProviders(<PasswordRulesChecklist password="Senha123!" />);

    expect(met()).toBe(4);
    expect(unmet()).toBe(0);
  });
});
