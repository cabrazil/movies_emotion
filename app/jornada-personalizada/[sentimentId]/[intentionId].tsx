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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.xs;
const CARD_WIDTH = (SCREEN_WIDTH - (2 * spacing.md) - CARD_MARGIN) / 2;
const CARD_HEIGHT = 45;

export default function JornadaPersonalizadaScreen() {
  const { sentimentId, intentionId, optionId, platforms, showResults } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<PersonalizedJourneyStep | null>(null);
  const [allSteps, setAllSteps] = useState<PersonalizedJourneyStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [allMovies, setAllMovies] = useState<MovieSuggestion[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]);
  const [platformsData, setPlatformsData] = useState<Record<number, string>>({});
  const [sortType, setSortType] = useState<'smart' | 'rating' | 'year' | 'relevance'>('year');
  const [visibleCount, setVisibleCount] = useState(12);
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
          const platformsMap: Record<number, string> = {};
          platforms.forEach((platform: any) => {
            platformsMap[platform.id] = platform.name;
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
              const selectedPlatformNames = platformIds.map(id => {
                // Buscar o nome da plataforma nos dados carregados
                const platform = Object.entries(platformsData).find(([platformId, name]) =>
                  parseInt(platformId) === id
                );
                const platformName = platform ? platform[1] : null;
                if (__DEV__) {
                }
                return platformName;
              }).filter(Boolean);

              if (__DEV__) {
              }

              const isMatch = selectedPlatformNames.includes(platformName) &&
                platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION';

              if (__DEV__ && isMatch) {
                console.log(`✅ Match encontrado: Filme "${suggestion.movie.title}" - Plataforma "${platformName}"`);
              }

              return isMatch;
            });

            if (__DEV__) {
              if (hasSelectedPlatform) {
                console.log(`✅ Filme "${suggestion.movie.title}" disponível em plataforma selecionada`);
              } else {
                console.log(`❌ Filme "${suggestion.movie.title}" não disponível nas plataformas selecionadas`);
              }
            }

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
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    yearText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
      color: isDark ? '#E0E0E0' : colors.text.secondary,
    },
    movieYear: {
      fontSize: typography.fontSize.small,
      color: isDark ? '#E0E0E0' : colors.text.secondary,
    },
    movieDescription: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
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
      color: isDark ? '#E0E0E0' : colors.text.secondary,
      marginLeft: 4,
    },
    certificationContainer: {
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    certificationText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.medium,
    },
    genresText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
    },
    runtimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    runtimeText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      marginLeft: 4,
    },
    reasonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.background.secondary,
    },
    reasonContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    reasonText: {
      flex: 1,
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
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
      color: isDark ? colors.gray[400] : colors.text.secondary, // Mais visível no Dark
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
            <TouchableOpacity
              key={option.id}
              style={[
                styles.genreOption,
                {
                  borderColor: sentimentColor,
                  borderWidth: 1.5,
                }
              ]}
              onPress={() => handleOption(option)}
              activeOpacity={0.7}
            >
              <Text
                style={styles.genreOptionText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
              >
                {option.mobileText || option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // Layout padrão para outras opções
    return step.options.map(option => {
      return (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.option,
            {
              borderLeftWidth: 4,
              borderLeftColor: sentimentColor,
              borderColor: colors.border.light,
            }
          ]}
          onPress={() => handleOption(option)}
          activeOpacity={0.7}
        >
          <Text style={styles.optionCardText}>{option.mobileText || option.text}</Text>
        </TouchableOpacity>
      );
    });
  }, [step, sentimentColor, handleOption, sentimentId, intentionId]);

  // Ordenar filmes baseado no critério selecionado
  const sortedMovies = useMemo(() => {
    // Lógica específica para "Recomendado" (Shuffle de Elite)
    if (sortType === 'relevance') {
      let moviesToShuffle = [];

      if (allMovies.length > 12) {
        // Modo Elite restrito
        // 1. Filtrar por relevância >= 6.5 (Piso de qualidade de elite)
        const eliteCandidates = allMovies.filter(s => ((s as any).relevanceScore ?? 0) >= 6.5);

        // 2. Ordenar por relevância (descendente) para pegar os melhores
        eliteCandidates.sort((a, b) => ((b as any).relevanceScore ?? 0) - ((a as any).relevanceScore ?? 0));

        // 3. Pegar apenas os top 12
        moviesToShuffle = eliteCandidates.slice(0, 12);
      } else {
        // Poucos filmes: mostrar todos disponíveis
        moviesToShuffle = [...allMovies];
      }

      // 4. Embaralhar (Shuffle)
      const shuffled = [...moviesToShuffle];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
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
  }, [allMovies, sortType, step]);

  const visibleMovies = useMemo(() => {
    return sortedMovies.slice(0, visibleCount);
  }, [sortedMovies, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Carregando jornada personalizada...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !step) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Jornada personalizada não encontrada'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Buscar o texto da opção escolhida
  const selectedOption = optionId ? allSteps
    .flatMap(s => s.options)
    .find(o => o.id.toString() === optionId.toString()) : null;

  if (allMovies.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.movieResultsContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                  onPress={() => setSortType('relevance')}
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
              <Pressable
                key={ms.movie.id + idx}
                style={({ pressed }) => [
                  styles.movieCard,
                  pressed && styles.movieCardPressed,
                  { borderLeftWidth: 4, borderLeftColor: sentimentColor } // Identidade visual consistente
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
                      intentionId: intentionId.toString()
                    }
                  });
                }}
              >
                <View style={styles.movieContent}>
                  {ms.movie.thumbnail && (
                    <Image source={{ uri: ms.movie.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
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
                              borderColor: colors.text.secondary,
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

                        {ms.movie.vote_average && (
                          <>
                            <Text style={styles.bulletPoint}>•</Text>
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={10} color={colors.yellow} />
                              <Text style={[styles.ratingText, { fontSize: 11 }]}>
                                {typeof ms.movie.vote_average === 'number'
                                  ? ms.movie.vote_average.toFixed(1)
                                  : ms.movie.vote_average}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Razão Emocional em destaque */}
                    <View style={[styles.reasonContainer, {
                      backgroundColor: sentimentColor + '10', // Fundo sutil
                      borderColor: sentimentColor + '30',
                      borderWidth: 1,
                      borderRadius: borderRadius.md,
                      padding: spacing.xs,
                      marginTop: spacing.xs,
                      borderTopWidth: 1, // Reset do estilo anterior
                      borderTopColor: sentimentColor + '30', // Reset
                    }]}>
                      <View style={styles.reasonContent}>
                        <Ionicons name="heart" size={14} color={sentimentColor} style={{ marginTop: 2 }} />
                        <Text style={[styles.reasonText, {
                          color: colors.text.primary,
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
                            <View style={[styles.platformBadge, { backgroundColor: colors.background.secondary, borderColor: 'transparent' }]}>
                              <Text style={[styles.platformBadgeText, { color: colors.text.secondary, fontSize: 10 }]}>
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
                          p.accessType === 'INCLUDED_WITH_SUBSCRIPTION' && p.streamingPlatform?.name
                        );
                      } else {
                        // Com filtro: mostrar só as que batem
                        const selectedPlatformNames = selectedPlatformIds.map(id => platformsData[id]).filter(Boolean);
                        platformsToShow = allPlatforms.filter(p => {
                          const pName = p.streamingPlatform?.name || '';
                          const isSub = p.accessType === 'INCLUDED_WITH_SUBSCRIPTION';
                          const isMatch = selectedPlatformNames.some(sName =>
                            pName.toLowerCase().trim().includes(sName.toLowerCase().trim())
                          );
                          return isSub && isMatch;
                        });
                      }

                      // Tem plataformas mas nenhuma de assinatura → somente aluguel/compra
                      if (platformsToShow.length === 0) {
                        return (
                          <View style={styles.platformBadgesContainer}>
                            <View style={[styles.platformBadge, { backgroundColor: colors.background.secondary, borderColor: 'transparent' }]}>
                              <Text style={[styles.platformBadgeText, { color: colors.text.secondary, fontSize: 10 }]}>
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
                            <Text style={{ fontSize: 10, color: colors.text.secondary, alignSelf: 'center', marginLeft: 4 }}>
                              +{platformsToShow.length - 1}
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </Pressable>
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
                    borderWidth: 1,
                    borderColor: sentimentColor,
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
          />
        </View>
      </SafeAreaView>
    );
  }

  // Exibir mensagem quando não há filmes E o usuário veio de filtros de plataformas
  if (showResults === 'true' && selectedPlatformIds.length > 0) {
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
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            step?.id === 38 && styles.genreContainer
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Header da pergunta */}
          <View style={styles.questionHeader}>
            <Text style={styles.question}>{step?.mobileQuestion || step?.question}</Text>

            {/* Badge de contexto melhorado */}
            {step?.contextualHint && (
              <View style={[
                styles.contextHintContainer,
                {
                  backgroundColor: sentimentColor + '10',
                  borderLeftColor: sentimentColor,
                }
              ]}>
                <Ionicons name="information-circle" size={18} color={sentimentColor} />
                <Text style={styles.contextHintText}>
                  {step.contextualHint}
                </Text>
              </View>
            )}
          </View>

          {renderOptions()}
        </ScrollView>

        {/* Indicador de scroll animado */}
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

        <NavigationFooter backLabel="Trocar Intenção" />
      </View>
    </SafeAreaView>
  );
} 