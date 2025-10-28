import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, SafeAreaView, Animated, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../../../config';
import { colors, typography, spacing, borderRadius, shadows } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { StreamingPlatform } from '../../../types';
import { AppHeader } from '../../../components/AppHeader';
import { NavigationFooter } from '../../../components/NavigationFooter';

// Helper para construir URL do logo
const getPlatformLogoUrl = (logoPath: string | null, platformName: string): string => {
  if (!logoPath) return '';
  
  // Se for YouTube, usar logo local neutro
  if (platformName.toLowerCase().includes('youtube')) {
    return 'https://moviesf-back.vercel.app/platforms/youtube.png';
  }
  
  // Se já for uma URL completa, retornar como está
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // Se começar com /platforms/, é um logo local do backend
  if (logoPath.startsWith('/platforms/')) {
    return `https://moviesf-back.vercel.app${logoPath}`;
  }
  
  // Caso contrário, é um caminho TMDB
  return `https://image.tmdb.org/t/p/w92${logoPath}`;
};

export default function PlataformasStreamingScreen() {
  const { sentimentId, intentionId, optionId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);

  // Obter cor do sentimento
  const sentimentColor = colors.sentimentColors[Number(sentimentId)] || colors.primary.main;

  // Animação do indicador de scroll
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Plataformas serão filtradas dinamicamente pela API usando showFilter

  useEffect(() => {
    fetchPlatforms();
  }, []);

         const fetchPlatforms = async () => {
           try {
             console.log('🌐 Buscando plataformas de streaming:', API_ENDPOINTS.streamingPlatforms.list);
             const response = await fetch(API_ENDPOINTS.streamingPlatforms.list, {
               headers: {
                 'Cache-Control': 'no-cache',
                 'Pragma': 'no-cache'
               }
             });
             if (!response.ok) {
               throw new Error('Erro ao carregar plataformas de streaming');
             }
      const data: StreamingPlatform[] = await response.json();
      console.log('✅ Plataformas carregadas:', data.length);
      
      // Filtrar apenas plataformas de assinatura e que não sejam HIDDEN
      const subscriptionPlatforms = data.filter(
        p => (p.category === 'SUBSCRIPTION_PRIMARY' || p.category === 'HYBRID') &&
             p.showFilter !== 'HIDDEN'
      );
      
      console.log('📺 Plataformas filtradas (assinatura + não-hidden):', subscriptionPlatforms.length);
      
      setPlatforms(subscriptionPlatforms);
      
      // Mostrar indicador se houver muitas plataformas PRIORITY
      const priorityPlatforms = subscriptionPlatforms.filter(p => p.showFilter === 'PRIORITY');
      setShowScrollIndicator(priorityPlatforms.length > 6);
    } catch (err) {
      console.error('❌ Erro ao carregar plataformas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Esconder indicador após 50px de scroll
    if (scrollY > 50 && showScrollIndicator) {
      Animated.timing(scrollIndicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScrollIndicator(false));
    }
  };

  const togglePlatform = (platformId: number) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleContinue = () => {
    // Navegar de volta para a jornada com as plataformas selecionadas
    // A tela de jornada irá mostrar os filmes filtrados
    router.push({
      pathname: '/jornada-personalizada/[sentimentId]/[intentionId]',
      params: {
        sentimentId: sentimentId.toString(),
        intentionId: intentionId.toString(),
        optionId: optionId.toString(),
        platforms: selectedPlatforms.join(','),
        showResults: 'true'
      }
    });
  };

  const handleSkip = () => {
    // Navegar de volta sem filtro de plataformas
    router.push({
      pathname: '/jornada-personalizada/[sentimentId]/[intentionId]',
      params: {
        sentimentId: sentimentId.toString(),
        intentionId: intentionId.toString(),
        optionId: optionId.toString(),
        platforms: '',
        showResults: 'true'
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Carregando plataformas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPlatforms}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Separar plataformas por showFilter (PRIORITY vs SECONDARY)
  const mainPlatforms = platforms.filter(p => p.showFilter === 'PRIORITY');
  const otherPlatforms = platforms.filter(p => p.showFilter === 'SECONDARY');

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Onde você assiste?</Text>
            <Text style={styles.subtitle}>
              Selecione suas plataformas de streaming para vermos filmes disponíveis para você
            </Text>
          </View>

          {/* Plataformas Principais */}
          <View style={styles.platformsContainer}>
            <Text style={styles.sectionTitle}>Principais Plataformas</Text>
            <View style={styles.platformsGrid}>
              {mainPlatforms.map((platform) => {
                const logoUrl = getPlatformLogoUrl(platform.logoPath, platform.name);
                return (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformCard,
                      selectedPlatforms.includes(platform.id) && {
                        borderColor: sentimentColor,
                        borderWidth: 2,
                        backgroundColor: sentimentColor + '10',
                      }
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                    activeOpacity={0.7}
                  >
                    {logoUrl ? (
                      <Image 
                        source={{ uri: logoUrl }} 
                        style={styles.platformLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.platformName} numberOfLines={2}>
                        {platform.name}
                      </Text>
                    )}
                    {selectedPlatforms.includes(platform.id) && (
                      <View style={[styles.checkmark, { backgroundColor: sentimentColor }]}>
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Outras Plataformas (Colapsável) */}
          {otherPlatforms.length > 0 && (
            <View style={styles.platformsContainer}>
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setShowOtherPlatforms(!showOtherPlatforms)}
                activeOpacity={0.7}
              >
                <Text style={styles.expandButtonText}>
                  Outras Plataformas ({otherPlatforms.length})
                </Text>
                <Ionicons 
                  name={showOtherPlatforms ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.text.primary} 
                />
              </TouchableOpacity>

              {showOtherPlatforms && (
                <View style={styles.platformsGrid}>
                  {otherPlatforms.map((platform) => {
                    const logoUrl = getPlatformLogoUrl(platform.logoPath, platform.name);
                    return (
                      <TouchableOpacity
                        key={platform.id}
                        style={[
                          styles.platformCard,
                          selectedPlatforms.includes(platform.id) && {
                            borderColor: sentimentColor,
                            borderWidth: 2,
                            backgroundColor: sentimentColor + '10',
                          }
                        ]}
                        onPress={() => togglePlatform(platform.id)}
                        activeOpacity={0.7}
                      >
                        {logoUrl ? (
                          <Image 
                            source={{ uri: logoUrl }} 
                            style={styles.platformLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.platformName} numberOfLines={2}>
                            {platform.name}
                          </Text>
                        )}
                        {selectedPlatforms.includes(platform.id) && (
                          <View style={[styles.checkmark, { backgroundColor: sentimentColor }]}>
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Informação sobre seleção */}
          {selectedPlatforms.length > 0 && (
            <View style={[styles.infoBox, { 
              backgroundColor: sentimentColor + '10',
              borderLeftColor: sentimentColor,
            }]}>
              <Ionicons name="information-circle" size={20} color={sentimentColor} />
              <Text style={styles.infoText}>
                {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'plataforma selecionada' : 'plataformas selecionadas'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Indicador de scroll */}
        {showScrollIndicator && (
          <Animated.View 
            style={[
              styles.scrollIndicator,
              { opacity: scrollIndicatorOpacity }
            ]}
          >
            <Ionicons name="chevron-down" size={24} color={sentimentColor} />
          </Animated.View>
        )}

        {/* Footer com botões de ação */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Pular esta etapa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: sentimentColor },
              selectedPlatforms.length === 0 && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={0.7}
            disabled={selectedPlatforms.length === 0}
          >
            <Text style={styles.continueButtonText}>
              Ver Sugestões {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
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
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.relaxed,
  },
  platformsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  platformLogo: {
    width: '100%',
    height: '100%',
  },
  platformName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  expandButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  skipButton: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.primary.main,
    fontSize: typography.fontSize.body,
  },
  errorText: {
    color: colors.state.error,
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: spacing.xl + 120, // Acima do footer
    alignSelf: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

