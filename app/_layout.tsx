import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function StackNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false, // Oculta o header padrão em todas as telas
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StackNavigator />
    </ThemeProvider>
  );
}