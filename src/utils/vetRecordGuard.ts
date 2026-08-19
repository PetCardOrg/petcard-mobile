import { Alert } from 'react-native';
import type { TFunction } from 'i18next';

/**
 * Parte comum aos registros de saúde: quem registrou.
 *
 * `veterinario_id` só vem preenchido quando quem registrou é um veterinário
 * do PetCard. Nome em texto livre não conta — pode ter sido o próprio tutor
 * digitando o nome do profissional que atendeu (api#117).
 */
export type RegistroComAutor = {
  veterinario_id?: string;
  veterinario_crmv?: string;
  veterinarian_name?: string;
};

export function ehRegistroDeVeterinario(registro: RegistroComAutor): boolean {
  return Boolean(registro.veterinario_id);
}

/**
 * `veterinarian_name` é texto livre e pode vir vazio mesmo em registro de
 * veterinário do PetCard — daí o rótulo genérico.
 */
function autor(registro: RegistroComAutor, t: TFunction): string {
  const nome = registro.veterinarian_name ?? t('healthRecords.vetRecord.autorDesconhecido');
  return registro.veterinario_crmv ? `${nome} (${registro.veterinario_crmv})` : nome;
}

/**
 * Confirma antes de alterar ou apagar um registro feito por um veterinário
 * (mobile#58).
 *
 * O tutor continua no comando dos próprios dados — o aviso não bloqueia, só
 * deixa claro que aquilo é orientação clínica de alguém e que a ação fica
 * marcada no histórico do pet, que é o que a api#117 garante.
 *
 * Para registro que não é de veterinário, segue direto: pedir confirmação
 * duas vezes para o que o próprio tutor digitou só criaria atrito.
 */
export function confirmarAcaoEmRegistroDeVet(opts: {
  registro: RegistroComAutor;
  nomeDoRegistro: string;
  acao: 'editar' | 'apagar';
  t: TFunction;
  onConfirm: () => void;
}): void {
  const { registro, nomeDoRegistro, acao, t, onConfirm } = opts;

  if (!ehRegistroDeVeterinario(registro)) {
    onConfirm();
    return;
  }

  const editando = acao === 'editar';

  Alert.alert(
    t(editando ? 'healthRecords.vetRecord.editTitle' : 'healthRecords.vetRecord.deleteTitle'),
    t(editando ? 'healthRecords.vetRecord.editMessage' : 'healthRecords.vetRecord.deleteMessage', {
      registro: nomeDoRegistro,
      vet: autor(registro, t),
    }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: editando
          ? t('healthRecords.vetRecord.continue')
          : t('petDetails.deleteDialog.confirm'),
        style: editando ? 'default' : 'destructive',
        onPress: onConfirm,
      },
    ],
  );
}
