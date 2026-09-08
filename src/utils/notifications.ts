import { isRunningInExpoGo } from 'expo';

export type NotificationsModule = typeof import('expo-notifications');

/**
 * Carrega `expo-notifications` sob demanda.
 *
 * O import estático no topo de um arquivo já executa o auto-registro de token do
 * pacote (`DevicePushTokenAutoRegistration.fx` chama `addPushTokenListener` em
 * escopo de módulo), e desde a SDK 57 isso lança no Android dentro do Expo Go —
 * derrubando o app antes de renderizar. Só chamar depois de checar
 * `isPushAvailable()`.
 */
export function loadNotifications(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

/**
 * Push remoto não existe em Expo Go desde a SDK 53, e no Android as APIs de
 * token lançam em vez de avisar. Fora do Expo Go tudo funciona normalmente.
 */
export function isPushAvailable(): boolean {
  return !isRunningInExpoGo();
}
