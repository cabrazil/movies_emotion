export const colors = {
  // Cores de fundo
  background: {
    primary: '#F5F5F5',    // Branco off-white
    card: '#FFFFFF',       // Branco puro para cards
    secondary: '#E8EAE6',  // Cinza quente
  },
  
  // Cores de destaque
  primary: {
    main: '#60B2A3',       // Teal suave
    light: '#6E9C9F',      // Teal mais claro
    dark: '#4A8A8C',       // Teal mais escuro
  },
  
  // Cores de texto
  text: {
    primary: '#1F1F1F',    // Cinza escuro quase preto
    secondary: '#666666',  // Cinza médio
    light: '#888888',      // Cinza claro
  },
  
  // Cores de estado
  state: {
    error: '#FF6B6B',      // Vermelho suave
    success: '#4CAF50',    // Verde suave
    warning: '#FFB74D',    // Laranja suave
  }
};

export const typography = {
  fontFamily: {
    primary: 'Inter',
    secondary: 'Inter',
  },
  
  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    bodySmall: 15,
    small: 14,
    tiny: 12,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
}; 