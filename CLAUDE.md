# petcard-mobile — Contexto para Claude Code

> **Plano da M7 (cross-repo, ordem das issues) vive na raiz: `../CLAUDE.md`.** Aqui só as convenções do mobile.

## O que é

App do **tutor** do PetCard. React Native + Expo + TypeScript. Consome a `petcard-api`.

## Stack

- **Expo + React Native + TypeScript.** Navegação: `@react-navigation` (native-stack, bottom-tabs, material-top-tabs, pager-view).
- **HTTP:** `axios` (`src/services`) — token em `expo-secure-store`, interceptor trata 401.
- **i18n:** `i18next` + `react-i18next`, pt-BR (`src/i18n`). Strings novas nos idiomas suportados.
- **DTOs:** `@petcardorg/shared` (+ `reflect-metadata`) — não duplicar tipos. Resolver exige `NODE_AUTH_TOKEN` (PAT `read:packages`).
- **Nativo Expo:** `expo-location` + `react-native-maps` (mapa/clínicas), `expo-notifications` (push, exige `FCM_ENABLED` + device físico), `expo-image-picker`, `expo-print`/`expo-sharing` (carteira), `expo-secure-store`, `expo-localization`.
- **Estrutura:** `src/{components,contexts,hooks,i18n,navigation,screens,services,test,utils}`.

## Testes & cobertura

- **jest-expo** (`jest.config.js`, preset `jest-expo`) + `@testing-library/react-native` 13 + `react-test-renderer` 19. Setup em `jest.setup.ts` (i18n pt-BR determinístico, `reflect-metadata`, mocks de expo-secure-store/localization/vector-icons e hooks de navegação). Helper `src/test/renderWithProviders.tsx`.
- ⚠️ **Não subir para `@testing-library/react-native` 14** — puxa jest 30 e conflita com o jest 29 do jest-expo.
- Comandos: `npm test`, `npm run test:cov`, `npm run typecheck` (`tsc --noEmit`).
- **Catraca (`jest.config.js`): statements 14 · branches 7 · functions 17 · lines 14 — não abaixar.** É honestamente baixa (12 telas pesadas com mapa/notificações fora); elevar é a próxima elevação, **não é M7** — não subir a catraca agora, mas cobrir código novo.

## Convenções

- **Lint/format no commit** (husky + lint-staged): `eslint --fix` em `*.{ts,tsx}`, `prettier --write` em `*.{ts,tsx,json,css,md}`.
- CI em `.github/workflows/ci.yml` roda `test:cov`. **CI verde é o DoD.**
- Git flow, commits e regras cross-repo: ver `../CLAUDE.md`. PR mira `develop`.

## M7 nesta repo (Fase 1, ordem em `../CLAUDE.md`)

- **mobile#54** — fluxo de cadastro/login (recuperação de senha, confirmação, verificação de e-mail, login Google). **O maior — exige endpoints novos de auth na api.**
- **mobile#57** perfil (foto, nome, deletar conta) · **#59** tutor vê histórico do pet (consome api#117) · **#58** aviso ao editar/apagar observação de vet · **#55** remover botões redundantes · **#56** arrastar duração no agendamento.
- Screenshots/README é PC-096; evidências dos UCs é PC-094.
