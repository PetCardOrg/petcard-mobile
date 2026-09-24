import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PetResponseDto } from '@petcardorg/shared';

/** Cada aba de saúde lembra o próprio pet, de forma independente. */
export type EscopoDeSelecao = 'vacinas' | 'vermifugos' | 'medicacoes';

type SelectedPetContextValue = {
  porEscopo: Partial<Record<EscopoDeSelecao, string>>;
  selecionarPorId: (escopo: EscopoDeSelecao, petId: string) => void;
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

  const selecionarPorId = useCallback((escopo: EscopoDeSelecao, petId: string) => {
    setPorEscopo((atual) => ({ ...atual, [escopo]: petId }));
  }, []);

  const limpar = useCallback((escopo: EscopoDeSelecao) => {
    setPorEscopo((atual) => {
      const resto = { ...atual };
      delete resto[escopo];
      return resto;
    });
  }, []);

  const value = useMemo(
    () => ({ porEscopo, selecionarPorId, limpar }),
    [porEscopo, selecionarPorId, limpar],
  );

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

  const { porEscopo, selecionarPorId, limpar } = context;

  return useMemo(
    () => ({
      selectedPetId: porEscopo[escopo] ?? null,
      selectPet: (pet: PetResponseDto) => selecionarPorId(escopo, pet.id),
      clearSelection: () => limpar(escopo),
    }),
    [porEscopo, escopo, selecionarPorId, limpar],
  );
}

/**
 * Escolhe o pet de uma aba de fora dela — a carteira digital usa para abrir
 * vacinas, vermífugos ou medicações já no pet que o tutor estava vendo.
 */
export function useSelecionarPetDaAba() {
  const context = useContext(SelectedPetContext);
  if (!context) {
    throw new Error('useSelecionarPetDaAba precisa estar dentro de SelectedPetProvider');
  }
  return context.selecionarPorId;
}
