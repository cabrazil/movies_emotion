import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from './theme';

// Importar o logo do Vibesfilm
const vibesfilmLogo = require('../assets/logo_header.png');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA', '#F0F2F5', '#E8EAE6']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        <View style={styles.content}>
        <Text style={styles.welcomeText}>Bem-vindo(a) ao</Text>
        
        <View style={styles.logoContainer}>
          <Image 
            source={vibesfilmLogo} 
            style={styles.logo}
            resizeMode="contain"
          />
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
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
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
  logo: {
    height: 80,
    width: 250,
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
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: typography.fontSize.h4 * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.sm,
  },
  button: {
    backgroundColor: '#1976D2',
    borderWidth: 0,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl * 1.5,
    borderRadius: borderRadius.lg,
    shadowColor: '#1976D2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.body * 1.2,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
