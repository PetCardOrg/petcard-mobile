import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import ptBR from './locales/pt-BR/common.json';
import enUS from './locales/en-US/common.json';

const LANGUAGE_STORAGE_KEY = 'petcard-language';

export const supportedLanguages = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en-US', label: 'English' },
] as const;

function getDeviceLanguage(): string {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageTag;

  if (deviceLang?.startsWith('pt')) return 'pt-BR';
  if (deviceLang?.startsWith('en')) return 'en-US';
  return 'pt-BR';
}

async function getStoredLanguage(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function persistLanguage(lang: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // silently fail
  }
}

export async function initI18n(): Promise<void> {
  const storedLang = await getStoredLanguage();
  const lng = storedLang ?? getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
    },
    lng,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en-US'],
    interpolation: {
      escapeValue: false,
    },
  });

  i18n.on('languageChanged', (lang) => {
    void persistLanguage(lang);
  });
}

export default i18n;
