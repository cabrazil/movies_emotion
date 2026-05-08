import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Pressable, Dimensions, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS, apiRequest } from '../../config';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { PersonalizedJourneyResponse, PersonalizedJourneyStep, JourneyOption, MovieSuggestion } from '../../types';
import { NavigationFooter } from '../../components/NavigationFooter';
import { AppHeader } from '../../components/AppHeader';
import { getCloudflareImageUrl } from '../../components/movie-details/movieHelpers';
import { GlassCard } from '../../components/premium/GlassCard';
import { SENTIMENT_GRADIENTS, DEFAULT_GRADIENT } from '../../components/premium/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.xs;
const CARD_WIDTH = (SCREEN_WIDTH - (2 * spacing.md) - CARD_MARGIN) / 2;
const CARD_HEIGHT = 45;

export default function JornadaPersonalizadaScreen() {
  const { sentimentId, intentionId, optionId, platforms, showResults, optionText } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<PersonalizedJourneyStep | null>(null);
  const [allSteps, setAllSteps] = useState<PersonalizedJourneyStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [allMovies, setAllMovies] = useState<MovieSuggestion[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]);
  const [platformsData, setPlatformsData] = useState<Record<number, { name: string, category: string }>>({});
  const [sortType, setSortType] = useState<'smart' | 'rating' | 'year' | 'relevance'>('relevance');
  const [relevanceSeed, setRelevanceSeed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasProcessedResults, setHasProcessedResults] = useState(false);
  const router = useRouter();

  // Obter cor do sentimento (memoizada)
  const sentimentColor = useMemo(() =>
    colors.sentimentColors[Number(sentimentId)] || colors.primary.main,
    [sentimentId, colors]
  );

  // Animação do indicador de scroll
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const totalMoviesInfo = useMemo(() => {
    return { total: allMovies.length };
  }, [allMovies.length]);

  // Buscar dados das plataformas para mapeamento dinâmico
  useEffect(() => {
    const fetchPlatformsData = async () => {
      try {
        const response = await apiRequest(API_ENDPOINTS.streamingPlatforms.list);
        if (response.ok) {
          const platforms = await response.json();
          const platformsMap: Record<number, { name: string; category: string }> = {};
          platforms.forEach((platform: any) => {
            platformsMap[platform.id] = { name: platform.name, category: platform.category };
          });
          setPlatformsData(platformsMap);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Erro ao carregar dados das plataformas:', error);
        }
      }
    };

    fetchPlatformsData();
  }, []);


  useEffect(() => {
    const fetchPersonalizedJourney = async () => {
      try {
        if (__DEV__) {
          console.log('🚀 Carregando jornada personalizada:', { sentimentId, intentionId });
        }

        const res = await apiRequest(API_ENDPOINTS.personalizedJourney.get(sentimentId.toString(), intentionId.toString()), {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) {
          throw new Error('Erro ao carregar jornada personalizada');
        }

        const data: PersonalizedJourneyResponse = await res.json();
        if (__DEV__) {
          console.log('📊 Dados da jornada recebidos:', {
            totalSteps: data.steps.length,
            firstStep: data.steps[0]?.stepId,
            stepIds: data.steps.map(s => s.stepId)
          });
        }



        setAllSteps(data.steps);

        if (data.steps.length > 0) {
          // Buscar o primeiro step (menor order ou primeiro disponível)
          const firstStep = data.steps.sort((a, b) => a.order - b.order)[0];
          if (__DEV__) {
            console.log('🎯 Primeiro step selecionado:', firstStep.stepId);
          }
          setStep(firstStep);
          setCurrentStepId(firstStep.stepId);

          // Lógica de indicador de scroll inicial
          if (firstStep.id !== 38 && firstStep.options.length >= 4) {
            setShowScrollIndicator(true);
            scrollIndicatorOpacity.setValue(1);
          } else {
            setShowScrollIndicator(false);
          }
        } else {
          throw new Error('Nenhum passo encontrado na jornada personalizada');
        }

        setLoading(false);
      } catch (err: unknown) {
        if (__DEV__) {
          console.error('❌ Erro detalhado:', err);
        }
        setError(`Erro ao carregar jornada personalizada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchPersonalizedJourney();
  }, [sentimentId, intentionId]);

  // Processar retorno da tela de plataformas
  useEffect(() => {
    if (showResults === 'true' && optionId && allSteps.length > 0) {
      setHasProcessedResults(true);
      if (__DEV__) {
        console.log('🔄 Retornando da tela de plataformas:', { optionId });
      }

      // Parsear plataformas selecionadas
      let platformIds: number[] = [];
      if (platforms && typeof platforms === 'string' && platforms.length > 0) {
        platformIds = platforms.split(',').map(id => parseInt(id, 10));
        setSelectedPlatformIds(platformIds);
        if (__DEV__) {
          console.log('📺 Plataformas selecionadas:', platformIds);
        }
      }

      // Buscar a opção que foi selecionada para pegar os filmes
      const option = allSteps
        .flatMap(s => s.options)
        .find(o => o.id.toString() === optionId.toString());

      if (option && option.isEndState && option.movieSuggestions) {
        let movies = option.movieSuggestions;
        if (__DEV__) {
          console.log('🎬 Total de filmes antes do filtro:', movies.length);
        }

        // Filtrar filmes por plataformas se houver seleção
        if (platformIds.length > 0) {

          movies = movies.filter(suggestion => {
            // Verificar se o filme tem plataformas
            if (!suggestion.movie.platforms || suggestion.movie.platforms.length === 0) {
              if (__DEV__) {
                console.log(`❌ Filme "${suggestion.movie.title}" sem plataformas`);
              }
              return false;
            }

            // Verificar se o filme está disponível em alguma das plataformas selecionadas
            // com acesso por assinatura (INCLUDED_WITH_SUBSCRIPTION)
            // SOLUÇÃO: Usar nomes de plataforma (igual ao web) em vez de IDs
            const hasSelectedPlatform = suggestion.movie.platforms.some(platform => {
              const platformName = platform.streamingPlatform?.name;

              if (!platformName) {
                if (__DEV__) {
                  console.log(`⚠️ Plataforma sem nome no filme "${suggestion.movie.title}"`);
                }
                return false;
              }

              // Mapear IDs para nomes das plataformas selecionadas usando dados reais
              const selectedPlatformInfos = platformIds.map(id => {
                // Buscar o nome e categoria da plataforma nos dados carregados
                return platformsData[id];
              }).filter(Boolean);

              const isMatch = selectedPlatformInfos.some(info => {
                const isNameMatch = info.name === platformName;
                const moviePlatformCategory = (platform.streamingPlatform?.category || '').toUpperCase().trim();
                const filterPlatformCategory = (info.category || '').toUpperCase().trim();
                
                const isKnownRentalPlatform = 
                  platformName.toLowerCase().includes('mercado') || 
                  platformName.toLowerCase().includes('apple tv');

                const isRentalPurchasePlatform = 
                  moviePlatformCategory === 'FREE_PRIMARY' || 
                  moviePlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                  filterPlatformCategory === 'FREE_PRIMARY' ||
                  filterPlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                  isKnownRentalPlatform;
                
                return isNameMatch && (
                  platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION' ||
                  platform.accessType === 'FREE_WITH_ADS' ||
                  (isRentalPurchasePlatform && (platform.accessType === 'RENTAL' || platform.accessType === 'PURCHASE'))
                );
              });

              return isMatch;
            });

            return hasSelectedPlatform;
          });

          if (__DEV__) {
            console.log('📺 Filmes após filtro de plataformas:', movies.length);
          }
        }

        setAllMovies(movies);
      }
    }
  }, [showResults, optionId, platforms, allSteps]);

  // Reset pagination when sort type or movies change
  useEffect(() => {
    setVisibleCount(12);
  }, [sortType, allMovies]);

  const handleOption = useCallback((option: JourneyOption) => {
    if (__DEV__) {
      console.log('🎯 Opção selecionada:', {
        optionId: option.id,
        text: option.mobileText || option.text,
        nextStepId: option.nextStepId,
        isEndState: option.isEndState,
        hasMovieSuggestions: option.movieSuggestions?.length || 0
      });
    }

    if (option.isEndState) {
      if (__DEV__) {
        console.log('🎬 Estado final alcançado, redirecionando para plataformas de streaming');
      }
      // Redirecionar para tela de seleção de plataformas de streaming
      router.push({
        pathname: '/plataformas-streaming/[sentimentId]/[intentionId]/[optionId]',
        params: {
          sentimentId: sentimentId.toString(),
          intentionId: intentionId.toString(),
          optionId: option.id.toString()
        }
      });
      return;
    }

    if (!option.nextStepId) {
      if (__DEV__) {
        console.error('❌ NextStepId não encontrado para opção não-final');
      }
      alert('Erro: próximo passo não definido.');
      return;
    }

    // Buscar próximo step
    const next = allSteps.find(s => s.stepId === option.nextStepId || s.id?.toString() === option.nextStepId);

    if (next) {
      if (__DEV__) {
        console.log('✅ Próximo step encontrado:', next.stepId);
      }
      setStep(next);
      setCurrentStepId(next.stepId);

      // Mostrar indicador se houver 4 ou mais opções
      if (next.id !== 38 && next.options.length >= 4) {
        setShowScrollIndicator(true);
        scrollIndicatorOpacity.setValue(1);
      } else {
        setShowScrollIndicator(false);
      }
    } else {
      if (__DEV__) {
        console.error('❌ Próximo step não encontrado:', {
          nextStepId: option.nextStepId,
          availableSteps: allSteps.map(s => ({ id: s.id, stepId: s.stepId }))
        });
      }
      alert(`Erro ao avançar: próximo passo '${option.nextStepId}' não encontrado`);
    }
  }, [allSteps, router, sentimentId, intentionId, scrollIndicatorOpacity]);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;

    // Esconder indicador após 100px de scroll (mais tolerante)
    if (scrollY > 100 && showScrollIndicator) {
      Animated.timing(scrollIndicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScrollIndicator(false));
    }
  }, [showScrollIndicator, scrollIndicatorOpacity]);

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
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: typography.fontSize.body,
      color: colors.primary.main,
      marginLeft: spacing.xs,
      fontWeight: typography.fontWeight.medium,
    },
    scrollContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    questionHeader: {
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.xs,
    },
    question: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
      textAlign: 'center',
      lineHeight: typography.fontSize.h3 * typography.lineHeight.tight,
    },
    contextHintContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderLeftWidth: 3,
    },
    contextHintText: {
      flex: 1,
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      marginLeft: spacing.xs,
      lineHeight: typography.fontSize.small * typography.lineHeight.relaxed,
    },
    hintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary.main + '10',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary.main,
    },
    hintText: {
      flex: 1,
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      marginLeft: spacing.sm,
      fontStyle: 'italic',
    },
    option: {
      width: '100%',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.md,
    },
    optionText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary,
      textAlign: 'center',
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    optionCardText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    genreGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    genreContainer: {
      paddingBottom: spacing.xl * 2,
    },
    genreOption: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    genreOptionText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary,
      textAlign: 'center',
      paddingHorizontal: spacing.xs,
    },
    moviesContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl * 2,
    },
    moviesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    moviesTitle: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
    },
    moviesCount: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
    },
    sortContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sortButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    sortButtonActive: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    sortButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border.light,
    },
    sortButtonText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
    },
    sortButtonTextActive: {
      color: colors.text.inverse,
    },
    sortButtonTextInactive: {
      color: colors.text.secondary,
    },
    movieCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.md,
    },
    movieCardPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    movieContent: {
      flexDirection: 'row',
    },
    thumbnail: {
      width: 100,
      height: 150,
      borderRadius: borderRadius.md,
    },
    movieHeader: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    moviePoster: {
      width: 60,
      height: 90,
      borderRadius: borderRadius.md,
      marginRight: spacing.md,
    },
    movieInfo: {
      flex: 1,
      marginLeft: spacing.sm,
      justifyContent: 'space-between',
    },
    movieTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF',
      marginBottom: spacing.xs,
    },
    yearText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
      color: 'rgba(255,255,255,0.75)',
    },
    movieYear: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.75)',
    },
    movieDescription: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.7)',
      lineHeight: typography.fontSize.small * typography.lineHeight.relaxed,
      marginTop: spacing.sm,
    },
    movieDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    ratingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    ratingText: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.75)',
      marginLeft: 4,
    },
    certificationContainer: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    certificationText: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: typography.fontWeight.medium,
    },
    genresText: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.65)',
    },
    runtimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    runtimeText: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.65)',
      marginLeft: 4,
    },
    reasonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
    },
    reasonContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    reasonText: {
      flex: 1,
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.8)',
      fontStyle: 'italic',
      marginLeft: spacing.xs,
    },
    platformBadgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    platformBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    platformBadgeText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
      textAlign: 'center',
    },
    movieResultsContainer: {
      padding: spacing.sm,
      paddingTop: spacing.xs,
      backgroundColor: colors.background.primary,
    },
    resultsHeader: {
      marginBottom: spacing.sm,
      alignItems: 'center',
    },
    optionContext: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      alignItems: 'center',
    },
    optionLabel: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
      fontWeight: typography.fontWeight.medium,
    },
    // optionText removido (duplicado)
    movieCountIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    movieCountText: {
      fontSize: typography.fontSize.small,
      color: colors.primary.main,
      marginLeft: spacing.xs,
      fontWeight: typography.fontWeight.medium,
    },
    // sortContainer secundário removido (duplicado), usar o principal ou criar específico se necessário
    sortContainerWrapper: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    sortChips: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      flexWrap: 'nowrap',
    },
    sortChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.medium,
      backgroundColor: colors.background.card,
      gap: spacing.xs,
    },
    sortChipIcon: {
      fontSize: 12,
    },
    sortChipText: {
      fontSize: typography.fontSize.small,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.medium,
    },
    sortChipTextActive: {
      color: colors.text.inverse,
      fontWeight: typography.fontWeight.semibold,
    },
    scrollIndicator: {
      position: 'absolute',
      bottom: 80, // Mais alto para não bater no Footer
      alignSelf: 'center',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.full,
      width: 44, // Levemente maior
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      zIndex: 999, // Garantir que flutue
      elevation: 10,
    },
    loadingText: {
      marginTop: spacing.md,
      color: colors.primary.main,
      fontSize: typography.fontSize.body,
    },
    errorText: {
      color: colors.state.error,
      fontSize: typography.fontSize.body,
      marginBottom: spacing.md,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
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
    noMoviesContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    noMoviesTitle: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    noMoviesSubtitle: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    backToFiltersButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      gap: spacing.sm,
    },
    backToFiltersButtonText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
    },
    bulletPoint: {
      color: 'rgba(255,255,255,0.45)',
      marginHorizontal: 4,
      fontSize: typography.fontSize.small,
    },
  }), [colors, isDark]);

  const renderOptions = useCallback(() => {
    if (!step) return null;

    // Layout em duas colunas para gêneros (step 38) - APENAS se for realmente gêneros
    // Verificar se é realmente um step de gêneros baseado no conteúdo, não apenas no ID
    const isGenreStep = step.id === 38 && step.options.every(option =>
      (option.mobileText || option.text).length < 30 // Gêneros são textos curtos
    );

    if (isGenreStep) {
      return (
        <View style={styles.genreGrid}>
          {step.options.map(option => (
            <GlassCard
              key={option.id}
              style={{ width: CARD_WIDTH, marginBottom: 8 }}
              intensity={15}
              borderColor={sentimentColor + '65'}
              borderWidth={1.5}
              borderRadius={12}
            >
              <TouchableOpacity
                style={{
                  height: CARD_HEIGHT,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                }}
                onPress={() => handleOption(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.genreOptionText, { color: '#FFFFFF', fontWeight: '500' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {option.mobileText || option.text}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>
      );
    }

    // Layout padrão para outras opções
    return step.options.map(option => {
      return (
        <GlassCard
          key={option.id}
          style={{ width: '100%', marginBottom: 12 }}
          intensity={15}
          borderColor={sentimentColor + '65'}
          borderWidth={1.5}
          borderRadius={16}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 18,
              paddingHorizontal: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => handleOption(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionCardText, { color: '#FFFFFF', fontWeight: '600', fontSize: 16 }]}>
              {option.mobileText || option.text}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      );
    });
  }, [step, sentimentColor, handleOption, sentimentId, intentionId, colors]);

  // Ordenar filmes baseado no critério selecionado
  const sortedMovies = useMemo(() => {
    // Lógica específica para "Recomendado" — Round-Robin por SubSentiment com boost de recência
    if (sortType === 'relevance') {
      const limit = allMovies.length > 12 ? 12 : allMovies.length;

      // 0. Jitter aleatório pré-calculado por filme (varia a cada clique)
      const jitterMap = new Map<string, number>();
      for (const suggestion of allMovies) {
        jitterMap.set(suggestion.movie.id, Math.random() * 0.5);
      }

      // 1. Score ajustado = relevanceScore + bônus de recência + jitter
      const getAdjustedScore = (suggestion: MovieSuggestion): number => {
        const score = (suggestion as any).relevanceScore ?? 0;
        const year = suggestion.movie.year ?? 2000;
        let recencyBonus = 0;
        if (year >= 2022) recencyBonus = 0.30;
        else if (year >= 2018) recencyBonus = 0.15;
        else if (year >= 2013) recencyBonus = 0.05;
        const jitter = jitterMap.get(suggestion.movie.id) ?? 0;
        return score + recencyBonus + jitter;
      };

      // 2. SubSentiment primário do filme (fallback para emotionalEntryType)
      const getPrimaryGroup = (suggestion: MovieSuggestion): string => {
        const sentiments = suggestion.movie.movieSentiments;
        if (sentiments && sentiments.length > 0) {
          return sentiments[0].subSentiment.name;
        }
        return (suggestion.movie as any).emotionalEntryType ?? 'OUTROS';
      };

      // 3. Agrupar por SubSentiment primário
      const groups = new Map<string, MovieSuggestion[]>();
      for (const suggestion of allMovies) {
        const key = getPrimaryGroup(suggestion);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(suggestion);
      }

      // 4. Ordenar dentro de cada grupo por adjustedScore desc
      for (const group of groups.values()) {
        group.sort((a, b) => getAdjustedScore(b) - getAdjustedScore(a));
      }

      // 5. Ordenar grupos pelo melhor adjustedScore do grupo
      const sortedGroups = Array.from(groups.values()).sort(
        (a, b) => getAdjustedScore(b[0]) - getAdjustedScore(a[0])
      );

      // 6. Round-robin entre grupos até atingir o limite
      const result: MovieSuggestion[] = [];
      let round = 0;
      while (result.length < limit) {
        let added = 0;
        for (const group of sortedGroups) {
          if (result.length >= limit) break;
          if (round < group.length) {
            result.push(group[round]);
            added++;
          }
        }
        if (added === 0) break;
        round++;
      }

      // 7. Garantia de frescor: ≥ 2 filmes de 2018+ nos primeiros 5
      if (result.length >= 5) {
        const recentThreshold = 2018;
        const top5Recent = result.slice(0, 5).filter(
          s => (s.movie.year ?? 0) >= recentThreshold
        ).length;

        if (top5Recent < 2) {
          const top5Ids = new Set(result.slice(0, 5).map(s => s.movie.id));
          const candidate = result.slice(5).find(
            s => (s.movie.year ?? 0) >= recentThreshold && !top5Ids.has(s.movie.id)
          );
          if (candidate) {
            const candidateIdx = result.indexOf(candidate);
            result.splice(candidateIdx, 1);
            result.splice(4, 0, candidate);
          }
        }
      }

      return result;
    }

    // Outras ordenações
    const sorted = [...allMovies].sort((a, b) => {
      switch (sortType) {
        case 'smart':
          // Score de diversidade (40% rating + 30% relevance + 15% year + 15% title hash)
          const getDiversityScore = (suggestion: MovieSuggestion) => {
            const movie = suggestion.movie;

            const imdbRating = movie.imdbRating ?? 0;
            const voteAverage = (movie as any).vote_average ?? 0;
            const ratingScore = (imdbRating * 0.6) + (voteAverage * 0.4);

            const relevanceScore = (suggestion as any).relevanceScore ?? 0;

            const yearScore = movie.year ? (movie.year - 1900) / 100 : 0;

            const titleHash = movie.title.split('').reduce((hash, char) => {
              return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
            }, 0);
            const titleScore = (titleHash % 100) / 100;

            return (ratingScore * 0.4) + (relevanceScore * 0.3) + (yearScore * 0.15) + (titleScore * 0.15);
          };

          return getDiversityScore(b) - getDiversityScore(a);

        case 'rating':
          const aRating = a.movie.imdbRating ?? -Infinity;
          const bRating = b.movie.imdbRating ?? -Infinity;
          if (bRating !== aRating) return bRating - aRating;

          const aVoteAvg = (a.movie as any).vote_average ?? -Infinity;
          const bVoteAvg = (b.movie as any).vote_average ?? -Infinity;
          return bVoteAvg - aVoteAvg;

        case 'year':
          const aYear = a.movie.year || 0;
          const bYear = b.movie.year || 0;
          return bYear - aYear;

        default:
          return 0;
      }
    });

    return sorted;
  }, [allMovies, sortType, step, relevanceSeed]);

  const visibleMovies = useMemo(() => {
    return sortedMovies.slice(0, visibleCount);
  }, [sortedMovies, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const gradient = SENTIMENT_GRADIENTS[Number(sentimentId)] || DEFAULT_GRADIENT;

  if (loading) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          <AppHeader showBack={true} showLogo={false} title="" transparent={true} />
          <View style={[styles.center, { backgroundColor: 'transparent' }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.loadingText, { color: 'rgba(255,255,255,0.7)' }]}>Carregando jornada personalizada...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !step) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          <AppHeader showBack={true} showLogo={false} title="" transparent={true} />
          <View style={[styles.center, { backgroundColor: 'transparent' }]}>
            <Text style={styles.errorText}>{error || 'Jornada personalizada não encontrada'}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Buscar o texto da opção escolhida
  const selectedOption = optionId ? allSteps
    .flatMap(s => s.options)
    .find(o => o.id.toString() === optionId.toString()) : null;

  if (allMovies.length > 0) {

    return (
      <LinearGradient
        colors={gradient}
        locations={[0, 0.4, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header customizado premium com botão voltar */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            height: 56,
          }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.12)',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                left: 20,
              }}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
              Sugestões Vibesfilm
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={[styles.movieResultsContainer, { paddingHorizontal: 20, backgroundColor: 'transparent' }]}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
            {/* Header compacto */}
            <View style={styles.resultsHeader}>
              {/* Título com a opção escolhida */}
              {selectedOption && (
                <View style={styles.optionContext}>
                  <Text style={styles.optionLabel}>Filmes sugeridos para:</Text>
                  <Text style={[styles.optionText, { color: sentimentColor }]}>
                    "{selectedOption.mobileText || selectedOption.text}"
                  </Text>
                </View>
              )}

              {/* Contador de filmes sempre visível */}
              <View style={styles.movieCountIndicator}>
                <Ionicons name="film-outline" size={16} color={colors.primary.main} />
                <Text style={styles.movieCountText}>
                  {totalMoviesInfo.total} filmes encontrados
                </Text>
              </View>
            </View>

            {/* Seletor de Ordenação Compacto */}
            <View style={styles.sortContainer}>
              <View style={styles.sortChips}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    (sortType === 'relevance' || sortType === 'smart') && {
                      backgroundColor: colors.primary.main,
                      borderColor: colors.primary.main
                    }
                  ]}
                  onPress={() => { setSortType('relevance'); setRelevanceSeed(s => s + 1); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sortChipIcon}>🎯</Text>
                  <Text style={[
                    styles.sortChipText,
                    (sortType === 'relevance' || sortType === 'smart') && styles.sortChipTextActive
                  ]}>
                    Recomendado
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortType === 'rating' && {
                      backgroundColor: colors.primary.main,
                      borderColor: colors.primary.main
                    }
                  ]}
                  onPress={() => setSortType('rating')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortChipIcon, { color: '#F5C518' }]}>★</Text>
                  <Text style={[
                    styles.sortChipText,
                    sortType === 'rating' && styles.sortChipTextActive
                  ]}>
                    Rating
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortType === 'year' && {
                      backgroundColor: colors.primary.main,
                      borderColor: colors.primary.main
                    }
                  ]}
                  onPress={() => setSortType('year')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sortChipIcon}>📅</Text>
                  <Text style={[
                    styles.sortChipText,
                    sortType === 'year' && styles.sortChipTextActive
                  ]}>
                    Ano
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {allMovies.length === 0 && (
              <View style={styles.noMoviesContainer}>
                <Text style={styles.noMoviesTitle}>
                  {selectedPlatformIds.length > 0
                    ? "Nenhuma sugestão de filme encontrada."
                    : "Nenhum filme sugerido para este caminho."}
                </Text>
                {selectedPlatformIds.length > 0 && (
                  <Text style={styles.noMoviesSubtitle}>
                    Tente selecionar outras plataformas de streaming ou pular o filtro.
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.backToFiltersButton, { borderColor: sentimentColor }]}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color={sentimentColor} />
                  <Text style={[styles.backToFiltersButtonText, { color: sentimentColor }]}>
                    {selectedPlatformIds.length > 0 ? "Voltar aos Filtros" : "Voltar"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {visibleMovies.map((ms: MovieSuggestion, idx: number) => (
              <GlassCard
                key={ms.movie.id + idx}
                intensity={12}
                borderColor={sentimentColor + '65'}
                borderWidth={1.5}
                borderRadius={16}
                style={{ marginBottom: 16 }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.movieCard,
                    pressed && styles.movieCardPressed,
                    { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0, elevation: 0, marginBottom: 0, padding: 16 }
                  ]}
                onPress={() => {
                  if (__DEV__) {
                    console.log('🎬 Navegando para filme:', {
                      id: ms.movie.id,
                      reason: ms.reason
                    });
                  }
                  router.push({
                    pathname: '/filme/[id]',
                    params: {
                      id: ms.movie.id,
                      reason: ms.reason,
                      sentimentId: sentimentId,
                      intentionId: intentionId.toString(),
                      optionText: optionText ? optionText.toString() : '',
                      relevanceScore: ((ms as any).relevanceScore)?.toString() || ''
                    }
                  });
                }}
              >
                <View style={styles.movieContent}>
                  {ms.movie.thumbnail && (
                    <Image source={{ uri: getCloudflareImageUrl(ms.movie.thumbnail) }} style={styles.thumbnail} resizeMode="cover" />
                  )}
                  <View style={styles.movieInfo}>
                    <View>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {ms.movie.title}
                      </Text>

                      {/* Metadados em linha única: Ano • Duração • Classificação • Nota */}
                      <View style={styles.movieDetails}>
                        <Text style={styles.yearText}>
                          {ms.movie.year || 'N/A'}
                        </Text>

                        {ms.movie.runtime && ms.movie.runtime > 0 && (
                          <>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.yearText}>
                              {Math.floor(ms.movie.runtime / 60)}h {ms.movie.runtime % 60}m
                            </Text>
                          </>
                        )}

                        {ms.movie.certification && (
                          <>
                            <Text style={styles.bulletPoint}>•</Text>
                            <View style={{
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.3)',
                              borderRadius: 2,
                              paddingHorizontal: 2,
                              justifyContent: 'center'
                            }}>
                              <Text style={[styles.yearText, { fontSize: 9, lineHeight: 11 }]}>
                                {ms.movie.certification}
                              </Text>
                            </View>
                          </>
                        )}

                        {ms.movie.imdbRating && (
                          <>
                            <Text style={styles.bulletPoint}>•</Text>
                            <View style={styles.ratingContainer}>
                              <Text style={[styles.ratingText, { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginRight: 2 }]}>IMDb</Text>
                              <Ionicons name="star" size={10} color={colors.yellow} />
                              <Text style={[styles.ratingText, { fontSize: 11, marginLeft: 2 }]}>
                                {ms.movie.imdbRating != null && !isNaN(Number(ms.movie.imdbRating))
                                  ? Number(ms.movie.imdbRating).toFixed(1)
                                  : 'N/A'}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Razão Emocional em destaque */}
                    <View style={[styles.reasonContainer, {
                      backgroundColor: sentimentColor + '10', // Fundo sutil
                      borderColor: sentimentColor + '65',
                      borderWidth: 1.5,
                      borderRadius: borderRadius.md,
                      padding: spacing.xs,
                      marginTop: spacing.xs,
                    }]}>
                      <View style={styles.reasonContent}>
                        <Ionicons name="heart" size={14} color={sentimentColor} style={{ marginTop: 2 }} />
                        <Text style={[styles.reasonText, {
                          color: '#FFFFFF',
                          fontStyle: 'normal',
                          fontSize: 11
                        }]} numberOfLines={3}>
                          {ms.reason}
                        </Text>
                      </View>
                    </View>

                    {/* Badge de Plataforma */}
                    {(() => {
                      const allPlatforms = ms.movie.platforms ?? [];

                      // Sem plataformas cadastradas → não disponível
                      if (allPlatforms.length === 0) {
                        return (
                          <View style={styles.platformBadgesContainer}>
                            <View style={[styles.platformBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'transparent' }]}>
                              <Text style={[styles.platformBadgeText, { color: 'rgba(255,255,255,0.5)', fontSize: 10 }]}>
                                Não disponível no momento
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      // Determinar plataformas de assinatura elegíveis
                      let platformsToShow: any[] = [];
                      if (selectedPlatformIds.length === 0) {
                        // Sem filtro: mostrar todas de assinatura
                        platformsToShow = allPlatforms.filter(p =>
                          (p.accessType === 'INCLUDED_WITH_SUBSCRIPTION' || p.accessType === 'FREE_WITH_ADS') && 
                          p.streamingPlatform?.name
                        );
                      } else {
                        // Com filtro: mostrar só as que batem
                        const selectedPlatformInfos = selectedPlatformIds.map(id => platformsData[id]).filter(Boolean);
                        platformsToShow = allPlatforms.filter(p => {
                          const pName = p.streamingPlatform?.name || '';
                          
                          return selectedPlatformInfos.some(info => {
                            const isNameMatch = pName.toLowerCase().trim().includes(info.name.toLowerCase().trim());
                            const moviePlatformCategory = (p.streamingPlatform?.category || '').toUpperCase().trim();
                            const filterPlatformCategory = (info.category || '').toUpperCase().trim();
                            
                            const isKnownRentalPlatform = 
                              pName.toLowerCase().includes('mercado') || 
                              pName.toLowerCase().includes('apple tv');

                            const isRentalPurchasePlatform = 
                              moviePlatformCategory === 'FREE_PRIMARY' || 
                              moviePlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                              filterPlatformCategory === 'FREE_PRIMARY' ||
                              filterPlatformCategory === 'RENTAL_PURCHASE_PRIMARY' ||
                              isKnownRentalPlatform;
                            
                            return isNameMatch && (
                              p.accessType === 'INCLUDED_WITH_SUBSCRIPTION' || 
                              p.accessType === 'FREE_WITH_ADS' ||
                              (isRentalPurchasePlatform && (p.accessType === 'RENTAL' || p.accessType === 'PURCHASE'))
                            );
                          });
                        });
                      }

                      // Tem plataformas mas nenhuma de assinatura → somente aluguel/compra
                      if (platformsToShow.length === 0) {
                        return (
                          <View style={styles.platformBadgesContainer}>
                            <View style={[styles.platformBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'transparent' }]}>
                              <Text style={[styles.platformBadgeText, { color: 'rgba(255,255,255,0.5)', fontSize: 10 }]}>
                                Somente aluguel/compra
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      // Exibir badge de assinatura normalmente
                      return (
                        <View style={styles.platformBadgesContainer}>
                          <View style={[styles.platformBadge, { backgroundColor: sentimentColor + '20', borderColor: 'transparent' }]}>
                            <Text style={[styles.platformBadgeText, { color: sentimentColor, fontSize: 10 }]}>
                              No {platformsToShow[0].streamingPlatform.name}
                            </Text>
                          </View>
                          {platformsToShow.length > 1 && (
                            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', alignSelf: 'center', marginLeft: 4 }}>
                              +{platformsToShow.length - 1}
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </Pressable>
            </GlassCard>
          ))}

            {/* Mensagem educativa para o Shuffle de Elite */}
            {sortType === 'relevance' && (
              <View style={{ padding: spacing.md, alignItems: 'center' }}>
                <Text style={{
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.small,
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  {allMovies.length > 12
                    ? "Top 12 selecionados. Para ver todos, ordene por Ano ou Rating."
                    : `${allMovies.length} filmes disponíveis com os filtros atuais`}
                </Text>
              </View>
            )}


            {/* Botão Ver Mais */}
            {visibleMovies.length < sortedMovies.length && (
              <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.background.card,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.full,
                    borderWidth: 1.5,
                    borderColor: sentimentColor + '65',
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...shadows.sm
                  }}
                  onPress={handleLoadMore}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: sentimentColor,
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.body,
                    marginRight: spacing.xs
                  }}>
                    Ver mais
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={sentimentColor} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Indicador de scroll animado */}
          {allMovies.length > 6 && (
            <Animated.View
              style={[
                styles.scrollIndicator,
                { opacity: scrollIndicatorOpacity }
              ]}
            >
              <Ionicons name="chevron-down" size={24} color={sentimentColor} />
            </Animated.View>
          )}

          <NavigationFooter
            backLabel="Nova Jornada"
            showHome={true}
            twoLineText={true}
            customBackRoute="/sentimentos"
            transparent={true}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

  // Exibir mensagem quando não há filmes E o usuário veio de filtros de plataformas
  // Só exibir DEPOIS que o processamento real aconteceu (hasProcessedResults) para evitar
  // race condition onde allSteps ainda estava vazio quando os params chegaram.
  if (showResults === 'true' && selectedPlatformIds.length > 0 && hasProcessedResults && allMovies.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.container}>
          <View style={styles.noMoviesContainer}>
            <Text style={styles.noMoviesTitle}>
              Nenhuma sugestão de filme encontrada.
            </Text>
            <Text style={styles.noMoviesSubtitle}>
              Tente selecionar outras plataformas de streaming ou pular o filtro.
            </Text>
            <TouchableOpacity
              style={[styles.backToFiltersButton, { borderColor: sentimentColor }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={sentimentColor} />
              <Text style={[styles.backToFiltersButtonText, { color: sentimentColor }]}>
                Voltar aos Filtros
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar a jornada normal quando não há filmes (estado inicial)

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header customizado premium com botão voltar */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.12)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              step?.id === 38 && styles.genreContainer,
              { paddingHorizontal: 24, paddingTop: 16 }
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Header da pergunta */}
            <View style={[styles.questionHeader, { marginBottom: 32 }]}>
              <Text style={[styles.question, { color: '#FFFFFF', fontSize: 32, lineHeight: 38, textAlign: 'left', fontWeight: '800' }]}>
                {step?.mobileQuestion || step?.question}
              </Text>

              {/* Badge de contexto melhorado usando GlassCard */}
              {step?.contextualHint && (
                <GlassCard
                  intensity={10}
                  borderColor={sentimentColor + '65'}
                  borderRadius={12}
                  borderWidth={1.5}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    padding: 14,
                    marginTop: 16,
                    gap: 8,
                  }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={sentimentColor} />
                  <Text style={[styles.contextHintText, { color: 'rgba(255, 255, 255, 0.75)', fontSize: 13, fontWeight: '500', lineHeight: 18, marginLeft: 0 }]}>
                    {step.contextualHint}
                  </Text>
                </GlassCard>
              )}
            </View>

            {renderOptions()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
} 
