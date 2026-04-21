import type { Theme } from '@react-navigation/native';

export const palette = {
  cream: '#FFF7EE',
  apricot: '#FFD9BF',
  peach: '#FFBC98',
  tomato: '#E85A3C',
  mint: '#9AD8B7',
  cocoa: '#422A21',
  cocoaFaded: '#8A6B60',
  card: '#FFF9F2',
  line: '#F2CBB8',
};

export const Colors = {
  light: {
    text: palette.cocoa,
    background: palette.cream,
  },
  dark: {
    text: palette.cocoa,
    background: palette.cream,
  },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const Fonts = {
  sans: 'System',
  serif: 'SpaceMono',
  rounded: 'System',
};

export const AppTheme: Theme = {
  dark: false,
  colors: {
    primary: palette.tomato,
    background: palette.cream,
    card: palette.card,
    text: palette.cocoa,
    border: palette.line,
    notification: palette.tomato,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '600',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800',
    },
  },
};