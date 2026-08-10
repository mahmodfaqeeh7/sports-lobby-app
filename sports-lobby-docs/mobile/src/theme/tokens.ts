export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#172033',
  muted: '#5D6B82',
  border: '#D8DEE8',
  accent: '#087F5B',
  danger: '#C2410C',
  subtle: '#8390A3',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 4,
  md: 8,
} as const;

export const typography = {
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  button: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
} as const;
