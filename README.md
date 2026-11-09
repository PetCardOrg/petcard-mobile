<div align="center">

<img src=".github/assets/logo.png" alt="Logo do PetCard" width="80" />

# PetCard Mobile

**App do tutor do PetCard: a carteira de saúde do pet no celular, com lembretes de vacina, clínicas próximas e consultas na agenda.**

[![CI](https://github.com/PetCardOrg/petcard-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/PetCardOrg/petcard-mobile/actions/workflows/ci.yml)
[![Cobertura](.github/badges/coverage.svg)](https://github.com/PetCardOrg/petcard-mobile/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-yellow.svg)](LICENSE)

[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Plataformas](https://img.shields.io/badge/plataformas-iOS%20%7C%20Android-lightgrey)](#como-rodar)

[Telas](#telas) · [Funcionalidades](#funcionalidades) · [Stack](#stack) · [Como rodar](#como-rodar) · [Testes](#testes) · [Ecossistema](#ecossistema)

</div>

---

## Telas

<div align="center">

<img src=".github/assets/screenshots/mobile-home.jpg" width="150" alt="Home com a lista de pets" />
<img src=".github/assets/screenshots/mobile-perfil-pet.jpg" width="150" alt="Perfil do pet" />
<img src=".github/assets/screenshots/mobile-saude.jpg" width="150" alt="Vacina com comprovante anexado" />
<img src=".github/assets/screenshots/mobile-carteira-qr.jpg" width="150" alt="Carteira digital com QR Code" />
<img src=".github/assets/screenshots/mobile-clinicas-mapa.jpg" width="150" alt="Mapa de clínicas próximas" />
<img src=".github/assets/screenshots/mobile-agenda.jpg" width="150" alt="Consulta sincronizada com o Google Agenda" />

<sub>Meus pets · Perfil do pet · Saúde · Carteira digital · Clínicas próximas · Agenda</sub>

</div>

## Funcionalidades

| | |
|:-:|---|
| 🔐 | Cadastro, login, recuperação de senha e login com Google |
| 🐶 | Vários pets por tutor, com foto, raça, idade e peso |
| 💉 | Vacinas, vermífugos e medicações, com próxima dose e foto do comprovante |
| 🧾 | Histórico clínico com tudo o que tutor e veterinário registraram |
| 📱 | Carteira digital por QR Code ou link, com opção de regenerar o QR e exportar em PDF |
| 🏷️ | QR de coleira para pet perdido e mapa de onde ele foi encontrado |
| 📍 | Clínicas próximas no mapa, com filtro de raio e de funcionamento, ligação e rota |
| 📅 | Consultas sincronizadas com o Google Agenda |
| 🔔 | Notificações de próximas doses, de consultas e de quando o QR da coleira é lido |
| 🌐 | Interface em português e inglês, trocada no perfil |

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.88 + Expo SDK 58 (development build) |
| Linguagem | TypeScript |
| Navegação | React Navigation 7 (stack, abas inferiores e abas superiores) |
| HTTP | Axios, com o token guardado no `expo-secure-store` |
| Mapas | `react-native-maps` + `expo-location` |
| Notificações | `expo-notifications` + Firebase Cloud Messaging |
| Login social | `@react-native-google-signin/google-signin` |
| Carteira em PDF | `expo-print` + `expo-sharing` |
| i18n | i18next + react-i18next (pt-BR e en-US) |
| Contratos | DTOs do [`@petcardorg/shared`](https://github.com/PetCardOrg/petcard-shared) |
| Testes | jest-expo + Testing Library |
| Build | EAS Build (perfis `development`, `preview` e `production`) |

```
src/
├── components/   componentes reutilizáveis
├── contexts/     sessão do tutor e pet selecionado
├── hooks/        hooks compartilhados
├── i18n/         traduções pt-BR e en-US
├── navigation/   pilhas e abas
├── screens/      uma pasta por área (Home, Saúde, Agenda, Clínicas, Perfil...)
├── services/     chamadas à API
├── test/         utilitários de teste
└── utils/        funções auxiliares
```

## Como rodar

**Pré-requisitos:** Node.js 20 LTS, npm 10, a [petcard-api](https://github.com/PetCardOrg/petcard-api) rodando, um token do GitHub com escopo `read:packages` (para baixar o `@petcardorg/shared`) e Xcode ou Android Studio.

O app usa módulos nativos (login com Google, mapas, push), então roda num **development build**, não no Expo Go.

```bash
git clone https://github.com/PetCardOrg/petcard-mobile.git
cd petcard-mobile

export NODE_AUTH_TOKEN=<seu_token_read_packages>
npm install

cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL e a chave do Google Maps

npm run ios              # ou: npm run android (compila e instala o development build)
npm start                # nas próximas vezes, só o Metro
```

> No celular físico, `localhost` não alcança o seu computador: use o IP da máquina na rede ou um túnel (ngrok) em `EXPO_PUBLIC_API_URL`. As notificações push só funcionam em aparelho físico.

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_API_URL` | Endereço da API |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa de clínicas |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | Login com Google (sem elas, o botão fica oculto) |

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o Metro |
| `npm run ios` · `npm run android` | Compila e abre no simulador ou aparelho |
| `npm run lint` · `npm run typecheck` | ESLint e checagem de tipos |
| `npm test` · `npm run test:cov` | Testes, com cobertura |

> Para atualizar dependências, use `npx expo install --fix`. Um `npm audit fix` puro já desalinhou a toolchain do Expo uma vez.

## Testes

Os testes usam jest-expo e Testing Library e seguem a política de **cobertura de confiança** ([ADR-006](https://github.com/PetCardOrg/petcard-docs/blob/main/architecture/adr/006-cobertura-de-confianca.md)): cobrem regras que afetam o tutor, como horários de consulta, validação de registros de saúde e estado da sincronização com a agenda. Telas pesadas de mapa e notificação ficam de fora de propósito, por isso a catraca de cobertura é mais baixa que a da API e da web. O CI roda `lint`, `typecheck` e `test:cov` em todo push e PR para `main` e `develop`.

## Ecossistema

| Repositório | O que é |
|---|---|
| [petcard-api](https://github.com/PetCardOrg/petcard-api) | API REST em NestJS |
| [petcard-web](https://github.com/PetCardOrg/petcard-web) | Área do veterinário em React + Vite |
| **petcard-mobile** | App do tutor (você está aqui) |
| [petcard-shared](https://github.com/PetCardOrg/petcard-shared) | DTOs e enums compartilhados |
| [petcard-docs](https://github.com/PetCardOrg/petcard-docs) | Documentação central, ADRs e board |

Para contribuir, siga o [guia de contribuição](https://github.com/PetCardOrg/petcard-docs/blob/main/CONTRIBUTING.md). Projeto de TCC em Ciência da Computação, UNIFOR, 2026, por Álvaro Araújo, Camila Martins e Ricardo Temporal. Licença [MIT](LICENSE).
