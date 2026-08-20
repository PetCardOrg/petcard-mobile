import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PetResponseDto } from '@petcardorg/shared';

type SelectedPetContextValue = {
  selectedPetId: string | null;
  selectPet: (pet: PetResponseDto) => void;
  clearSelection: () => void;
};

const SelectedPetContext = createContext<SelectedPetContextValue | null>(null);

/**
 * Guarda qual pet o tutor está olhando nas telas de saúde.
 *
 * Cada tela mantinha a escolha num estado próprio, e o navegador da aba troca
 * o componente ativo — trocar de vacina para vermífugo desmontava a tela e a
 * escolha morria junto, jogando o tutor de volta para a lista de pets.
 * Guardando aqui, a escolha atravessa a troca de aba e continua valendo ao ir
 * e voltar de outra parte do app.
 *
 * Guarda o **id**, não o objeto: a tela resolve o pet na lista que já carrega,
 * então nome e foto acompanham uma edição, e pet excluído simplesmente deixa
 * de ser encontrado — o tutor cai na seleção, que é o certo.
 */
export function SelectedPetProvider({ children }: { children: ReactNode }) {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const selectPet = useCallback((pet: PetResponseDto) => {
    setSelectedPetId(pet.id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPetId(null);
  }, []);

  const value = useMemo(
    () => ({ selectedPetId, selectPet, clearSelection }),
    [selectedPetId, selectPet, clearSelection],
  );

  return <SelectedPetContext.Provider value={value}>{children}</SelectedPetContext.Provider>;
}

export function useSelectedPet(): SelectedPetContextValue {
  const context = useContext(SelectedPetContext);
  if (!context) {
    throw new Error('useSelectedPet precisa estar dentro de SelectedPetProvider');
  }
  return context;
}
