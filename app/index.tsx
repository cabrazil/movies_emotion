import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { HOME_GRADIENT } from './components/premium/GradientBackground';

const vibesfilmLogo = require('../assets/logo_header_dark.png');

export default function HomeScreen() {
  const router = useRouter();

  if (__DEV__) {
    console.log('🏠 HomeScreen carregada');
  }

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/sentimentos');
  };

  return (
    <LinearGradient
      colors={HOME_GRADIENT}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header com logo */}
        <View style={styles.header}>
          <Image
            source={vibesfilmLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Conteúdo Central */}
        <View style={styles.content}>
          <View style={styles.decorativeCircle} />
          <Text style={styles.tagline}>Cinema & Emoção</Text>
          <Text style={styles.title}>
            Cada emoção{'\n'}tem um filme.
          </Text>
          <Text style={styles.description}>
            Encontre a obra certa para o seu momento.
            Deixe o cinema{' '}
            <Text style={styles.highlightText}>processar</Text>,{' '}
            <Text style={styles.highlightText}>transformar</Text>
            {' '}ou{' '}
            <Text style={styles.highlightText}>amplificar</Text>
            {' '}o que você sente.
          </Text>
        </View>

        {/* Rodapé: Botão premium */}
        <View style={styles.footer}>
          {/* Botão atmosférico premium com gradiente e glow */}
          <TouchableOpacity
            style={styles.buttonOuter}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(80, 100, 200, 0.55)', 'rgba(60, 80, 180, 0.35)', 'rgba(40, 60, 160, 0.50)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Como você se sente agora?</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botão Secundário: Vibe do Dia */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/curadoria-diaria')}
            activeOpacity={0.7}
          >
            <View style={styles.secondaryButtonContent}>
              <Text style={styles.secondaryButtonTitle}>✨ Perfeito para hoje</Text>
              <Text style={styles.secondaryButtonSubtitle}>Uma pequena curadoria para o seu momento.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 32, // Alinhado perfeitamente com o conteúdo
    paddingTop: 24, // Espaçamento elegante em relação ao status bar
  },
  logo: {
    height: 80,
    width: 80,
    borderRadius: 16, // Deixa as bordas do logo suavemente arredondadas e integradas
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(100, 140, 255, 0.08)',
    top: -60,
    right: -80,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 54,
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 28,
    fontWeight: '400',
  },
  highlightText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 20,
    alignItems: 'center',
  },
  buttonOuter: {
    width: '100%',
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(150, 170, 255, 0.28)',
    // Glow externo suave
    shadowColor: '#5566cc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  secondaryButtonContent: {
    alignItems: 'center',
  },
  secondaryButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '400',
  },
});
