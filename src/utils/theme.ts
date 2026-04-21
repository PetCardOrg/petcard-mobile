export const colors = {
  background: '#F6FBFE',
  border: '#D8EEF6',
  danger: '#E63946',
  dangerSoft: '#FEF2F2',
  muted: '#607D8B',
  primary: '#27A9D8',
  primaryDark: '#107FA8',
  primarySoft: '#E6F7FC',
  success: '#06A77D',
  successSoft: '#E7F8F1',
  surface: '#FFFFFF',
  text: '#14313F',
  warning: '#D4880F',
  warningSoft: '#FFF5DA',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '800' as const },
  h3: { fontSize: 18, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700' as const },
  button: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '700' as const },
};
