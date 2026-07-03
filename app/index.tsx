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
            Encontre o filme certo para o seu momento.
          </Text>
          <Text style={styles.description}>
            Deixe o cinema{' '}
            <Text style={styles.highlightText}>acolher</Text>,{' '}
            <Text style={styles.highlightText}>transformar</Text>
            {' '}ou{' '}
            <Text style={styles.highlightText}>ampliar</Text>
            {' '}o que você sente.
          </Text>
        </View>

        {/* Rodapé: Botões + Assinatura de Marca */}
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

          {/* Assinatura de Marca VibesFilm */}
          <Text style={styles.brandSignature}>Cada emoção tem um filme.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  logo: {
    height: 80,
    width: 80,
    borderRadius: 16,
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
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 26,
    fontWeight: '400',
  },
  highlightText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 56,
    gap: 12,
    alignItems: 'center',
  },
  buttonOuter: {
    width: '100%',
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(150, 170, 255, 0.28)',
    shadowColor: '#5566cc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonContent: {
    alignItems: 'center',
  },
  secondaryButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '400',
  },
  brandSignature: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 6,
  },
});
