import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS, apiRequest } from '../../../config';
import { typography, spacing, borderRadius, shadows } from '../../../theme';
import { useTheme } from '../../../hooks/useTheme';
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
              return platformName === platform.name &&
                moviePlatform.accessType === 'INCLUDED_WITH_SUBSCRIPTION';
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

      // Filtrar apenas plataformas de assinatura e que não sejam HIDDEN
      const subscriptionPlatforms = data.filter(
        p => (p.category === 'SUBSCRIPTION_PRIMARY' || p.category === 'HYBRID') &&
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
  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border.medium,
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
      opacity: 0.5,
      borderColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },
    platformLogoEmpty: {
      opacity: 0.6,
    },
    platformNameEmpty: {
      color: colors.text.secondary,
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
      borderWidth: 2,
      ...shadows.sm,
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
  }), [colors]);

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

  // Renderização unificada de todas as plataformas

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
        >
          {/* Header Compacto */}
          <View style={styles.header}>
            <Text style={styles.title}>Onde você assiste?</Text>
            {selectedOptionText ? (
              <View style={styles.optionContext}>
                <Text
                  style={styles.optionText}
                  adjustsFontSizeToFit={true}
                  numberOfLines={2}
                >
                  Sugestões para: <Text style={{ color: sentimentColor, fontWeight: 'bold' }}>"{selectedOptionText}"</Text>
                </Text>
              </View>
            ) : (
              <Text style={styles.subtitle}>
                Selecione suas preferências
              </Text>
            )}
          </View>

          {/* Microcopy educativo */}
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <Text style={{ fontSize: typography.fontSize.small, color: colors.text.secondary, textAlign: 'center' }}>
              Filtre por streaming ou veja todos os filmes.
            </Text>
          </View>

          {/* Lista Unificada de Plataformas */}
          <View style={styles.platformsContainer}>
            <View style={styles.platformsGrid}>
              {platforms.map((platform) => {
                const logoUrl = getPlatformLogoUrl(platform.logoPath, platform.name);
                const movieCount = platformMovieCounts[platform.id] || 0;
                const hasMovies = movieCount > 0;

                return (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformCard,
                      selectedPlatforms.includes(platform.id) && {
                        borderColor: sentimentColor,
                        borderWidth: 2,
                        backgroundColor: sentimentColor + '10',
                      },
                      !hasMovies && styles.platformCardEmpty
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                    activeOpacity={0.7}
                    disabled={!hasMovies}
                  >
                    {logoUrl ? (
                      <View style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: borderRadius.sm,
                        padding: 4,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Image
                          source={{ uri: logoUrl }}
                          style={[styles.platformLogo, !hasMovies && styles.platformLogoEmpty]}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <Text style={[styles.platformName, !hasMovies && styles.platformNameEmpty]} numberOfLines={2}>
                        {platform.name}
                      </Text>
                    )}

                    {/* Badge de contagem de filmes */}
                    {hasMovies && (
                      <View style={[styles.movieCountBadge, { backgroundColor: sentimentColor }]}>
                        <Text style={styles.movieCountText}>{movieCount}</Text>
                      </View>
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

        {/* Indicador de scroll removido */}

        {/* Footer com botões de ação */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: sentimentColor }]}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: sentimentColor }]}>Ver todos os filmes</Text>
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
              Ver Sugestões
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


