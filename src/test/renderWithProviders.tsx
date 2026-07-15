import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Providers({ children }: { children: ReactNode }) {
  // i18n é o singleton global já inicializado em jest.setup.ts, então basta
  // envolver com o provedor de safe-area (necessário para telas que usam
  // SafeAreaView). Router é mockado em jest.setup, não precisa de container.
  return <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>{children}</SafeAreaProvider>;
}

/**
 * Renderiza um componente dentro dos provedores globais do app (safe-area +
 * i18n). Reutilizável em todas as telas/componentes — não duplicar setup.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react-native';
