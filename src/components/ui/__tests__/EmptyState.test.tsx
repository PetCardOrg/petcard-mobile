import { renderWithProviders, screen, fireEvent } from '../../../test/renderWithProviders';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    renderWithProviders(
      <EmptyState title="Nenhum pet cadastrado" description="Adicione seu primeiro pet." />,
    );

    expect(screen.getByText('Nenhum pet cadastrado')).toBeVisible();
    expect(screen.getByText('Adicione seu primeiro pet.')).toBeVisible();
  });

  it('não renderiza botão de ação sem actionLabel', () => {
    renderWithProviders(<EmptyState title="Vazio" description="..." />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('dispara onActionPress ao tocar no botão', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <EmptyState
        title="Vazio"
        description="..."
        actionLabel="Adicionar pet"
        onActionPress={onPress}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Adicionar pet' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
