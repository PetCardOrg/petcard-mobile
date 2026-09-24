/**
 * Params que o `useRoute` mockado devolve durante os testes.
 *
 * Telas que leem `route.params` (a aba de saúde pedida pelo resumo, o prefill
 * do agendamento) precisam de um jeito de o teste escolher esses params. Um
 * `jest.spyOn` sobre o módulo do react-navigation não serve: o namespace do
 * `import *` é uma cópia, e o espião não chega ao que a tela chama.
 *
 * O prefixo `mock` é exigência do Jest para poder ser referenciado dentro da
 * factory de `jest.mock`. O `jest.setup.ts` zera isto entre os testes.
 */
export const mockRotaDeTeste: { params?: Record<string, unknown> } = {};
