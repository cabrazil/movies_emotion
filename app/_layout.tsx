import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Oculta o header padrão em todas as telas
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#0A0E27',
        },
      }}
    />
  );
}