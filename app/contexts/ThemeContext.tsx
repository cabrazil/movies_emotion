import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { colorsLight, colorsDark } from '../theme';

interface ThemeContextType {
  colors: typeof colorsLight;
  isDark: boolean;
  colorScheme: 'light' | 'dark' | null;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: colorsLight,
  isDark: false,
  colorScheme: 'light',
  toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  // Inicializar com 'light' como fallback se systemColorScheme for null
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(systemColorScheme || 'light');

  useEffect(() => {
    // Atualizar quando o tema do sistema mudar
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      if (newColorScheme) {
        setColorScheme(newColorScheme);
      }
    });

    // Também atualizar inicialmente (com fallback para 'light')
    if (systemColorScheme) {
      setColorScheme(systemColorScheme);
    } else {
      // Se não conseguir detectar, usar 'light' como padrão
      setColorScheme('light');
    }

    return () => {
      subscription.remove();
    };
  }, [systemColorScheme]);

  // Garantir que sempre temos um valor válido
  const finalColorScheme = colorScheme || 'light';
  const isDark = finalColorScheme === 'dark';
  const colors = isDark ? colorsDark : colorsLight;

  const toggleTheme = () => {
    setColorScheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, colorScheme: finalColorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

