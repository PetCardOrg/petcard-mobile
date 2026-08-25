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
- **Cobertura de confiança, não percentual (ADR-006).** Antes de escrever um `it()`: _se quebrar, uma regra de negócio quebrou ou o usuário foi impactado?_ Se não, não escrever — sem teste para service que só chama `axios` nem para componente visual estático.
- **Catraca (`jest.config.js`): statements 19 · branches 14 · functions 19 · lines 19 — freio de regressão, não meta.** Não abaixar sem ADR; também não inventar teste para subir. Segue baixa porque as 12 telas pesadas (mapa, notificações) estão fora de propósito.

## Convenções

- **Lint/format no commit** (husky + lint-staged): `eslint --fix` em `*.{ts,tsx}`, `prettier --write` em `*.{ts,tsx,json,css,md}`.
- CI em `.github/workflows/ci.yml` roda `test:cov`. **CI verde é o DoD.**
- Git flow, commits e regras cross-repo: ver `../CLAUDE.md`. PR mira `develop`.

## M7 nesta repo (Fase 1, ordem em `../CLAUDE.md`)

- **Ainda falta só a mobile#54** — fluxo de cadastro/login (recuperação de senha, confirmação, verificação de e-mail, login Google). **O maior do grupo — exige endpoints novos de auth na api.** Não foi tocada ainda.
- **#59, #58 e #57 fechadas** (18–24/08): tutor vê o histórico do pet (consome api#117); aviso ao editar/apagar observação de vet; perfil do tutor (trocar foto, editar nome/telefone, deletar conta — mobile#73).
- **#55 e #56 têm o código mergeado (PR #70, 2026-08-23)** mas as issues seguem abertas no GitHub — board dessincronizado, só falta fechar manualmente.
- ⚠️ **Incidente registrado:** um `npm audit fix` desalinhou a toolchain do Expo (SDK 54) e quebrou o bundle de dev (corrigido no PR #69). **Usar `expo install --fix`, nunca `npm audit fix` puro**, neste repo.
- Screenshots/README é PC-096; evidências dos UCs é PC-094.
