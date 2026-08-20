import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PetResponseDto } from '@petcardorg/shared';

/** Cada aba de saúde lembra o próprio pet, de forma independente. */
export type EscopoDeSelecao = 'vacinas' | 'vermifugos' | 'medicacoes';

type SelectedPetContextValue = {
  porEscopo: Partial<Record<EscopoDeSelecao, string>>;
  selecionar: (escopo: EscopoDeSelecao, pet: PetResponseDto) => void;
  limpar: (escopo: EscopoDeSelecao) => void;
};

const SelectedPetContext = createContext<SelectedPetContextValue | null>(null);

/**
 * Guarda qual pet o tutor está olhando em cada aba de saúde.
 *
 * As telas guardavam a escolha num estado próprio e a perdiam ao serem
 * desmontadas. Aqui a escolha vive acima delas, então sobrevive a sair da aba
 * de saúde e voltar depois de passar por outra parte do app.
 *
 * Guarda o **id**, não o objeto: a tela resolve o pet na lista que já carrega,
 * então nome e foto acompanham uma edição, e pet excluído simplesmente deixa
 * de ser encontrado — o tutor cai na seleção, que é o certo.
 */
export function SelectedPetProvider({ children }: { children: ReactNode }) {
  const [porEscopo, setPorEscopo] = useState<Partial<Record<EscopoDeSelecao, string>>>({});

  const selecionar = useCallback((escopo: EscopoDeSelecao, pet: PetResponseDto) => {
    setPorEscopo((atual) => ({ ...atual, [escopo]: pet.id }));
  }, []);

  const limpar = useCallback((escopo: EscopoDeSelecao) => {
    setPorEscopo((atual) => {
      const resto = { ...atual };
      delete resto[escopo];
      return resto;
    });
  }, []);

  const value = useMemo(() => ({ porEscopo, selecionar, limpar }), [porEscopo, selecionar, limpar]);

  return <SelectedPetContext.Provider value={value}>{children}</SelectedPetContext.Provider>;
}

type SelecaoDaAba = {
  selectedPetId: string | null;
  selectPet: (pet: PetResponseDto) => void;
  clearSelection: () => void;
};

export function useSelectedPet(escopo: EscopoDeSelecao): SelecaoDaAba {
  const context = useContext(SelectedPetContext);
  if (!context) {
    throw new Error('useSelectedPet precisa estar dentro de SelectedPetProvider');
  }

  const { porEscopo, selecionar, limpar } = context;

  return useMemo(
    () => ({
      selectedPetId: porEscopo[escopo] ?? null,
      selectPet: (pet: PetResponseDto) => selecionar(escopo, pet),
      clearSelection: () => limpar(escopo),
    }),
    [porEscopo, escopo, selecionar, limpar],
  );
}
