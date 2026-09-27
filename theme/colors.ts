/**
 * FarmaApp - Design System: Clinical Apothecary Minimalist
 * Built for high-throughput, mission-critical retail pharmacy operations.
 * Absolute precision, zero decorative noise, high-contrast legibility.
 */

export const Colors = {
  // Canvas & Surfaces
  canvas: '#ffffff',
  background: '#f8f9ff',
  surface: '#f8f9ff',
  surfaceDim: '#cbdbf5',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  surfaceVariant: '#d3e4fe',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  border: '#cbd5e1',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  surfaceTint: '#565e74',
  inputBackground: '#eff4ff',

  // Inks & Typography (Core Ink & Hierarchy)
  text: '#0b1c30', // on-surface
  onSurface: '#0b1c30',
  textSecondary: '#45464d', // on-surface-variant
  onSurfaceVariant: '#45464d',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',

  // Brand Primary & Operations (Monochromatic Surgical Ink)
  primary: '#000000',
  onPrimary: '#ffffff',
  primaryContainer: '#131b2e',
  onPrimaryContainer: '#7c839b',
  primaryLight: '#eff4ff',
  primaryDark: '#0b1c30',
  inversePrimary: '#bec6e0',
  primaryFixed: '#dae2fd',
  primaryFixedDim: '#bec6e0',
  onPrimaryFixed: '#131b2e',

  // Surgical Restrained Functional Accents
  // Teal / Sage Confirm (Positive confirmations)
  secondary: '#006a61',
  onSecondary: '#ffffff',
  secondaryContainer: '#86f2e4',
  onSecondaryContainer: '#006f66',
  tealConfirm: '#0d9488',
  tealWash: '#f0fdfa',
  success: '#006a61',
  successBg: '#f0fdfa',

  // Clinical Alert / Error (Warnings, holds, annulments)
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  clinicalAlert: '#be123c',
  alertWash: '#fff1f2',
  danger: '#ba1a1a',
  dangerBg: '#fff1f2',

  // Warning / Pending
  warning: '#d97706',
  warningBg: '#fef3c7',

  // Tertiary
  tertiary: '#000000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#40000d',
  onTertiaryContainer: '#f13f5c',

  // UI Utilities
  scannerFrame: '#006a61',
  overlayBackground: 'rgba(11, 28, 48, 0.78)',
  white: '#ffffff',
  black: '#000000',
};

export const Rounded = {
  sm: 2,      // 0.125rem
  DEFAULT: 4, // 0.25rem (Strict soft standard for interactive controls)
  md: 6,      // 0.375rem
  lg: 8,      // 0.5rem (panels, modals, action blocks)
  xl: 12,     // 0.75rem
  full: 9999, // Quantitative status dots only
};

export const Spacing = {
  gutter: 16,
  gutterDesktop: 24,
  margin: 16,
  marginTablet: 24,
  marginDesktop: 32,
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 40,
  // Convenient shorthand aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  fontFamily: undefined, // Defaults to Inter in Expo
  family: {
    regular: undefined,
    medium: undefined,
    semiBold: undefined,
    bold: undefined,
  },
  size: {
    xxs: 10,
    xs: 11,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 26,
  },
  headlineXl: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headlineLg: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  headlineMd: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  headlineSm: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  tabularPrice: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 26,
  },
};
