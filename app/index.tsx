import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from './theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.subtitle}>Encontre filmes que combinam com seu momento</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/sentimentos')}
        >
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  logoContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 320,
  },
  subtitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  button: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.background.card,
    fontSize: typography.fontSize.body * 1.2,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
}); 