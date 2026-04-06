# 🐾 PetCard Mobile

[![CI](https://github.com/PetCardOrg/petcard-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/PetCardOrg/petcard-mobile/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplicativo mobile do tutor no ecossistema PetCard. App construído com React Native (Expo) para gerenciamento da saúde dos pets, carteira digital e busca de clínicas veterinárias.

**Projeto de TCC** — Ciência da Computação (2026)

## Ecossistema PetCard

Este repositório faz parte de um conjunto de 5 repos:

| Repositório                                                    | Descrição                        |
| -------------------------------------------------------------- | -------------------------------- |
| [petcard-api](https://github.com/PetCardOrg/petcard-api)       | Backend NestJS                   |
| [petcard-web](https://github.com/PetCardOrg/petcard-web)       | Painel do Veterinário (React.js) |
| **petcard-mobile**                                             | ← Você está aqui                 |
| [petcard-shared](https://github.com/PetCardOrg/petcard-shared) | DTOs e tipos compartilhados      |
| [petcard-docs](https://github.com/PetCardOrg/petcard-docs)     | Documentação e gestão do projeto |

## Stack

| Camada       | Tecnologia               |
| ------------ | ------------------------ |
| Framework    | React Native + Expo      |
| Linguagem    | TypeScript 5.x           |
| Navegação    | React Navigation         |
| HTTP Client  | Axios                    |
| Autenticação | Auth0 (OAuth 2.0)        |
| Notificações | Firebase Cloud Messaging |
| i18n         | i18next (pt-BR / en-US)  |

## Pré-requisitos

- Node.js >= 20 LTS
- npm >= 10
- Expo Go (no celular) ou emulador Android/iOS
- Backend (petcard-api) rodando em http://localhost:3000

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/PetCardOrg/petcard-mobile.git
cd petcard-mobile

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL da API e credenciais Auth0

# 4. Inicie o Expo
npm start
# Escaneie o QR Code com o Expo Go ou pressione 'a' para Android / 'i' para iOS
```

## Scripts

| Comando           | Descrição                     |
| ----------------- | ----------------------------- |
| `npm start`       | Inicia o Metro Bundler (Expo) |
| `npm run android` | Abre no emulador Android      |
| `npm run ios`     | Abre no simulador iOS         |
| `npm run lint`    | Executa ESLint                |

## Funcionalidades

- Cadastro e login do tutor via Auth0
- Gerenciamento de pets (CRUD)
- Registro de vacinas, vermifugações e medicações
- Carteira digital de saúde com QR Code
- Compartilhamento de link exclusivo da carteira
- Busca de clínicas veterinárias com mapa interativo
- Agendamentos com sync Google Calendar
- Notificações push de lembretes e notas clínicas
- Suporte a português e inglês

## Contribuição

Leia o [CONTRIBUTING.md](https://github.com/PetCardOrg/petcard-docs/blob/main/CONTRIBUTING.md) no repositório petcard-docs.
