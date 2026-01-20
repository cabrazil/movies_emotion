import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius, shadows } from './theme';
import { useTheme } from './hooks/useTheme';

// Importar os logos do Vibesfilm para light e dark mode
const vibesfilmLogoLight = require('../assets/logo_header.png');
const vibesfilmLogoDark = require('../assets/logo_header_dark.png');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();

  // Log para debug - aparecerá no console do dispositivo
  if (__DEV__) {
    console.log('🏠 HomeScreen carregada');
  }

  // Escolher o logo baseado no tema
  const vibesfilmLogo = isDark ? vibesfilmLogoDark : vibesfilmLogoLight;

  // Gradientes diferentes para light e dark mode
  const gradientColors = isDark
    ? ['#121212', '#1E1E1E', '#2A2A2A', '#1E1E1E'] as const
    : ['#FFFFFF', '#F8F9FA', '#F0F2F5', '#E8EAE6'] as const;

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      padding: spacing.md,
    },
    // Header superior com Logo e Toggle
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
    },
    logo: {
      height: 40,
      width: 140,
    },
    themeToggle: {
      padding: spacing.xs,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: borderRadius.full,
    },

    // Área de conteúdo central
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    welcomeText: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: typography.fontSize.h1,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
      lineHeight: typography.fontSize.h1 * 1.2,
    },
    description: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.regular,
      color: colors.text.secondary,
      marginBottom: spacing.xl,
      lineHeight: typography.fontSize.body * 1.5,
    },

    // Rodapé com botão fixo
    footer: {
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.sm,
    },
    button: {
      backgroundColor: colors.primary.main,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      shadowColor: colors.primary.main,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonText: {
      color: colors.text.inverse,
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        {/* Header: Logo e Toggle */}
        <View style={styles.header}>
          <Image
            source={vibesfilmLogo}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={24}
              color={isDark ? colors.yellow : colors.primary.main}
            />
          </TouchableOpacity>
        </View>

        {/* Conteúdo Central */}
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Bem-vindo(a)</Text>
          <Text style={styles.title}>Encontre o filme perfeito para sua vibe.</Text>
          <Text style={styles.description}>
            O cinema vai além de espelhar seu estado de espírito: ele pode te ajudar a processar uma emoção,
            transformar seu humor ou explorar novas sensações.
          </Text>
        </View>

        {/* Rodapé: Botão de Ação */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/sentimentos')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Começar Jornada</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
