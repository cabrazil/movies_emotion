import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Platform as RNPlatform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS, apiRequest } from '../../../config';
import { typography, spacing, borderRadius, shadows } from '../../../theme';
import { useTheme } from '../../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { StreamingPlatform } from '../../../types';
import { GlassCard } from '../../../components/premium/GlassCard';
import { SENTIMENT_GRADIENTS, DEFAULT_GRADIENT } from '../../../components/premium/GradientBackground';

// Helper para construir URL do logo
const getPlatformLogoUrl = (logoPath: string | null, platformName: string): string => {
  if (!logoPath) return '';

  // Se for YouTube, usar logo local neutro
  if (platformName.toLowerCase().includes('youtube')) {
    return 'https://moviesf-back.vercel.app/platforms/youtube.png';
  }

  // Se já for uma URL completa, retornar como está
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    if (logoPath.includes('dadrodpfylduydjbdxpy.supabase.co')) {
      return logoPath.replace(
        'https://dadrodpfylduydjbdxpy.supabase.co/storage/v1/object/public/movie-images',
        'https://images.vibesfilm.com'
      );
    }
    return logoPath;
  }

  // Se começar com /platforms/, é um logo local do backend
  if (logoPath.startsWith('/platforms/')) {
    return `https://moviesf-back.vercel.app${logoPath}`;
  }

  // Caso contrário, é um caminho TMDB
  return `https://image.tmdb.org/t/p/w92${logoPath}`;
};

// Helper para formatar nomes longos no iOS
const formatPlatformName = (name: string): string => {
  if (!name) return name;
  const lowerName = name.toLowerCase();
  if (lowerName === 'globoplay') return 'Globo\nPlay';
  if (lowerName === 'paramount+') return 'Para\nmount+';
  if (lowerName === 'claro video') return 'Claro\nVideo';
  if (lowerName === 'apple tv+') return 'Apple\nTV+';
  if (lowerName === 'prime video') return 'Prime\nVideo';
  if (lowerName === 'mercado play') return 'Mercado\nPlay';
  if (lowerName === 'hbo max') return 'HBO\nMax';
  return name;
};

export default function PlataformasStreamingScreen() {
  const { sentimentId, intentionId, optionId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
  const [platformMovieCounts, setPlatformMovieCounts] = useState<Record<number, number>>({});
  const [selectedOptionText, setSelectedOptionText] = useState<string>('');

  // Obter cor do sentimento (memoizada)
  const sentimentColor = useMemo(() =>
    colors.sentimentColors[Number(sentimentId)] || colors.primary.main,
    [sentimentId, colors]
  );

  // Animação do indicador de scroll
  // Indicador de scroll removido
  // const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  // const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Função para contar filmes por plataforma
  const fetchMovieCountsByPlatform = async (platforms: StreamingPlatform[]) => {
    try {
      // Buscar filmes da opção escolhida
      const response = await apiRequest(API_ENDPOINTS.personalizedJourney.get(sentimentId.toString(), intentionId.toString()));
      if (!response.ok) throw new Error('Erro ao carregar jornada');

      const data = await response.json();
      const allSteps = data.steps;
      const option = allSteps
        .flatMap((s: any) => s.options)
        .find((o: any) => o.id.toString() === optionId.toString());

      if (!option || !option.movieSuggestions) {
        if (__DEV__) {
          console.log('❌ Opção ou filmes não encontrados');
        }
        return {};
      }

      // Armazenar o texto da opção escolhida
      setSelectedOptionText(option.text);
      if (__DEV__) {
        console.log('📝 Opção escolhida:', option.text);
      }

      const movies = option.movieSuggestions;
      const counts: Record<number, number> = {};

        // Contar filmes por plataforma
        platforms.forEach(platform => {
          let count = 0;

          movies.forEach((suggestion: any) => {
            if (suggestion.movie.platforms && suggestion.movie.platforms.length > 0) {
              const hasPlatform = suggestion.movie.platforms.some((moviePlatform: any) => {
                const platformName = moviePlatform.streamingPlatform?.name;
                const moviePlatformCategory = (moviePlatform.streamingPlatform?.category || '').toUpperCase().trim();
                const targetPlatformCategory = (platform.category || '').toUpperCase().trim();
                
                const isKnownRentalPlatform = 
                  platform.name.toLowerCase().includes('mercado') || 
                  platform.name.toLowerCase().includes('apple tv') ||
                  (platformName || '').toLowerCase().includes('mercado') || 
                  (platformName || '').toLowerCase().includes('apple tv');

                const isRentalPurchasePlatform = 
                  moviePlatformCategory === 'FREE_PRIMARY' || 
                  moviePlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                  targetPlatformCategory === 'FREE_PRIMARY' ||
                  targetPlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                  isKnownRentalPlatform;

                return platformName === platform.name && (
                  moviePlatform.accessType === 'INCLUDED_WITH_SUBSCRIPTION' ||
                  moviePlatform.accessType === 'FREE_WITH_ADS' ||
                  (isRentalPurchasePlatform && (moviePlatform.accessType === 'RENTAL' || moviePlatform.accessType === 'PURCHASE'))
                );
              });

              if (hasPlatform) count++;
            }
          });

          counts[platform.id] = count;
        });

      // Log resumido apenas com plataformas que têm filmes
      if (__DEV__) {
        const platformsWithMovies = Object.entries(counts)
          .filter(([_, count]) => count > 0)
          .map(([id, count]) => {
            const platform = platforms.find(p => p.id.toString() === id);
            return `${platform?.name}: ${count}`;
          });
        if (platformsWithMovies.length > 0) {
          console.log(`📊 Filmes por plataforma: ${platformsWithMovies.join(', ')}`);
        } else {
          console.log('📊 Nenhum filme encontrado nas plataformas');
        }
      }

      setPlatformMovieCounts(counts);
      return counts;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Erro ao contar filmes por plataforma:', error);
      }
      return {};
    }
  };

  // Plataformas serão filtradas dinamicamente pela API usando showFilter

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.streamingPlatforms.list, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar plataformas de streaming');
      }
      const data: StreamingPlatform[] = await response.json();
      if (__DEV__) {
        console.log('✅ Plataformas carregadas:', data.length);
      }

      // Filtrar plataformas relevantes (assinatura, híbridas e gratuitas) que não sejam HIDDEN
      const subscriptionPlatforms = data.filter(
        p => (p.category === 'SUBSCRIPTION_PRIMARY' || p.category === 'HYBRID' || p.category === 'FREE_PRIMARY') &&
          p.showFilter !== 'HIDDEN'
      );

      if (__DEV__) {
        console.log('📺 Plataformas filtradas (assinatura + não-hidden):', subscriptionPlatforms.length);
      }

      setPlatforms(subscriptionPlatforms);

      // Contar filmes por plataforma
      await fetchMovieCountsByPlatform(subscriptionPlatforms);

      // Mostrar indicador se houver muitas plataformas PRIORITY
      // Lógica de indicador removida
    } catch (err) {
      if (__DEV__) {
        console.error('❌ Erro ao carregar plataformas:', err);
      }
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // handleScroll removido

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
    if (__DEV__) {
      console.log('🔄 Retornando da tela de plataformas:', {
        optionId,
        platformsCount: selectedPlatforms.length
      });
    }
    router.push({
      pathname: '/jornada-personalizada/[sentimentId]/[intentionId]',
      params: {
        sentimentId: sentimentId.toString(),
        intentionId: intentionId.toString(),
        optionId: optionId.toString(),
        platforms: selectedPlatforms.join(','),
        showResults: 'true',
        optionText: selectedOptionText
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
        showResults: 'true',
        optionText: selectedOptionText
      }
    });
  };

  // Criar estilos dinamicamente com base no tema
  const gradient = SENTIMENT_GRADIENTS[Number(sentimentId)] || DEFAULT_GRADIENT;

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollView: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },

    header: {
      padding: spacing.md,
      paddingBottom: spacing.lg, // Aumentado de 'sm' para 'lg' para dar mais respiro
      alignItems: 'center',
    },
    iconContainer: {
      width: 60, // Menor
      height: 60, // Menor
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: typography.fontSize.h2, // H2 em vez de H1
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: 2, // Mínimo
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.fontSize.small, // Menor
      color: colors.text.secondary,
      textAlign: 'center',
    },
    optionContext: {
      marginTop: spacing.xs, // Menor
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    optionLabel: {
      display: 'none', // Oculto pois incorporamos no texto principal
    },
    optionText: {
      fontSize: typography.fontSize.small, // Menor
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    platformsContainer: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.xl + 8, // Aumentado um pouco para dar mais respiro abaixo do texto do topo
      marginBottom: spacing.md, // Menor
    },
    sectionTitle: { // Caso ainda seja usado em outro lugar
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    platformsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    platformCard: {
      width: 70,
      height: 70,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      ...shadows.sm,
    },
    platformLogo: {
      width: 40,
      height: 40,
    },
    platformName: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
      color: '#FFFFFF',
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
    movieCountBadge: {
      position: 'absolute',
      top: -6,
      left: -6,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      ...shadows.sm,
    },
    movieCountText: {
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.inverse,
      textAlign: 'center',
    },
    platformCardEmpty: {
      opacity: 0.38,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    platformLogoEmpty: {
      opacity: 0.28,
    },
    platformNameEmpty: {
      color: 'rgba(255, 255, 255, 0.45)',
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
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      gap: spacing.sm,
    },
    skipButton: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1.5,
    },
    skipButtonText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
    },
    continueButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
      width: '100%',
    },
    continueButtonDisabled: {
      opacity: 0.5,
    },
    continueButtonText: {
      color: colors.text.inverse,
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
      bottom: spacing.xl + 120,
      alignSelf: 'center',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.full,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    },
    // === Novos estilos premium ===
    floatingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
      height: 56,
      position: 'relative',
    },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      left: 20,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    platformTouchable: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
    },
    logoWrapper: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: borderRadius.sm,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    selectionText: {
      fontSize: typography.fontSize.small,
      fontWeight: '600',
    },
    hintText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium, // Destaque extra
      color: 'rgba(255,255,255,0.85)', // Elevada opacidade para maior clareza
      textAlign: 'center',
    },
    continueButtonOuter: {
      width: '100%',
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    continueButtonGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
  }), [colors]);

  if (loading) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={sentimentColor} />
            <Text style={[styles.loadingText, { color: 'rgba(255,255,255,0.7)' }]}>Carregando plataformas...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPlatforms}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Filtrar e ordenar plataformas: APENAS plataformas com filmes disponíveis (count > 0), ordenadas por quantidade decrescente
  const sortedPlatforms = useMemo(() => {
    return platforms
      .filter(p => (platformMovieCounts[p.id] || 0) > 0)
      .sort((a, b) => {
        const countA = platformMovieCounts[a.id] || 0;
        const countB = platformMovieCounts[b.id] || 0;
        if (countA !== countB) return countB - countA;
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [platforms, platformMovieCounts]);

  // Contexto da opção escolhida
  return (
    <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header flutuante minimalista */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Onde você assiste?</Text>
        </View>

        <View style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Contexto da opção escolhida */}
            {selectedOptionText ? (
              <View style={styles.optionContext}>
                <Text style={styles.optionText} adjustsFontSizeToFit numberOfLines={2}>
                  Sugestões para:{' '}
                  <Text style={{ color: sentimentColor, fontWeight: '700' }}>"{selectedOptionText}"</Text>
                </Text>
              </View>
            ) : null}

            {/* Grade de plataformas — sólido e legível */}
            <View style={styles.platformsContainer}>
              <View style={styles.platformsGrid}>
                {sortedPlatforms.map((platform) => {
                  const logoUrl = getPlatformLogoUrl(platform.logoPath, platform.name);
                  const movieCount = platformMovieCounts[platform.id] || 0;
                  const hasMovies = movieCount > 0;
                  const isSelected = selectedPlatforms.includes(platform.id);

                  return (
                    <TouchableOpacity
                      key={platform.id}
                      style={[
                        styles.platformCard,
                        isSelected && {
                          borderColor: sentimentColor + '65',
                          borderWidth: 1.5,
                          backgroundColor: sentimentColor + '18',
                        },
                        !hasMovies && styles.platformCardEmpty
                      ]}
                      onPress={() => togglePlatform(platform.id)}
                      activeOpacity={0.7}
                      disabled={!hasMovies}
                    >
                      {RNPlatform.OS === 'ios' || !logoUrl ? (
                        <Text style={[styles.platformName, !hasMovies && styles.platformNameEmpty]} numberOfLines={2}>
                          {formatPlatformName(platform.name)}
                        </Text>
                      ) : (
                        <View style={styles.logoWrapper}>
                          <Image
                            source={{ uri: logoUrl }}
                            style={[styles.platformLogo, !hasMovies && styles.platformLogoEmpty]}
                            resizeMode="contain"
                          />
                        </View>
                      )}

                      {/* Badge de contagem */}
                      {hasMovies && (
                        <View style={[styles.movieCountBadge, { backgroundColor: sentimentColor }]}>
                          <Text style={styles.movieCountText}>{movieCount}</Text>
                        </View>
                      )}

                      {/* Checkmark selecionado */}
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: sentimentColor }]}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer transparente — integrado ao gradiente */}
          <View style={styles.footer}>
            {/* Status de seleção */}
            {selectedPlatforms.length > 0 ? (
              <View style={styles.selectionInfo}>
                <Ionicons name="checkmark-circle" size={18} color={sentimentColor} />
                <Text style={[styles.selectionText, { color: sentimentColor }]}>
                  {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'plataforma selecionada' : 'plataformas selecionadas'}
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>Selecione plataformas ou veja todos os filmes</Text>
            )}

            {/* Botão "Ver todos" — borda translúcida, texto branco */}
            <TouchableOpacity
              style={[styles.skipButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipButtonText, { color: '#FFFFFF' }]}>Ver todos os filmes</Text>
            </TouchableOpacity>

            {/* Botão "Ver Sugestões" — sólido na cor do sentimento */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: sentimentColor },
                selectedPlatforms.length === 0 && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={selectedPlatforms.length === 0}
            >
              <Text style={styles.continueButtonText}>Ver Sugestões</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
