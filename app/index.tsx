import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from './theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
        <Text style={styles.welcomeText}>Bem-vindo(a) ao</Text>
        
        <View style={styles.logoContainer}>
          {/* TODO: Substituir por logo quando disponível */}
          <Text style={styles.brandName}>Vibesfilm</Text>
        </View>
        
        <Text style={styles.title}>Encontre o filme perfeito para sua vibe!</Text>
        
        <Text style={styles.description}>
          O cinema vai além de espelhar seu estado de espírito: ele pode te ajudar a processar uma emoção, 
          transformar seu humor, manter uma boa energia ou explorar novas sensações.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/sentimentos')}
        >
          <Text style={styles.buttonText}>Vamos começar</Text>
        </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  welcomeText: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.light,
    textAlign: 'center',
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  description: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary.light,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl * 1.5,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.body * 1.2,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 