import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Pressable, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../../config';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { PersonalizedJourneyResponse, PersonalizedJourneyStep, JourneyOption, MovieSuggestion } from '../../types';
import { NavigationFooter } from '../../components/NavigationFooter';
import { AppHeader } from '../../components/AppHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.xs;
const CARD_WIDTH = (SCREEN_WIDTH - (2 * spacing.md) - CARD_MARGIN) / 2;
const CARD_HEIGHT = 45;

export default function JornadaPersonalizadaScreen() {
  const { sentimentId, intentionId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<PersonalizedJourneyStep | null>(null);
  const [allSteps, setAllSteps] = useState<PersonalizedJourneyStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [suggestedMovies, setSuggestedMovies] = useState<MovieSuggestion[] | null>(null);
  const [allMovies, setAllMovies] = useState<MovieSuggestion[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [moviesPerPage] = useState(3);
  const router = useRouter();

  // Obter cor do sentimento
  const sentimentColor = colors.sentimentColors[Number(sentimentId)] || colors.primary.main;

  const loadMoreMovies = () => {
    const nextPage = currentPage + 1;
    const startIndex = nextPage * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const newMovies = allMovies.slice(startIndex, endIndex);
    
    if (newMovies.length > 0) {
      setSuggestedMovies(prev => [...(prev || []), ...newMovies]);
      setCurrentPage(nextPage);
    }
  };

  const hasMoreMovies = () => {
    return allMovies.length > (currentPage + 1) * moviesPerPage;
  };

  const getTotalMoviesInfo = () => {
    const currentlyShowing = suggestedMovies?.length || 0;
    const total = allMovies.length;
    return { currentlyShowing, total };
  };

  useEffect(() => {
    const fetchPersonalizedJourney = async () => {
      try {
        console.log('🚀 Carregando jornada personalizada:', { sentimentId, intentionId });
        
        const res = await fetch(API_ENDPOINTS.personalizedJourney.get(sentimentId.toString(), intentionId.toString()));
        if (!res.ok) {
          throw new Error('Erro ao carregar jornada personalizada');
        }
        
        const data: PersonalizedJourneyResponse = await res.json();
        console.log('📊 Dados da jornada recebidos:', {
          totalSteps: data.steps.length,
          firstStep: data.steps[0]?.stepId,
          stepIds: data.steps.map(s => s.stepId)
        });
        

        
        setAllSteps(data.steps);
        
        if (data.steps.length > 0) {
          // Buscar o primeiro step (menor order ou primeiro disponível)
          const firstStep = data.steps.sort((a, b) => a.order - b.order)[0];
          console.log('🎯 Primeiro step selecionado:', firstStep.stepId);
          setStep(firstStep);
          setCurrentStepId(firstStep.stepId);
        } else {
          throw new Error('Nenhum passo encontrado na jornada personalizada');
        }
        
        setLoading(false);
      } catch (err: unknown) {
        console.error('❌ Erro detalhado:', err);
        setError(`Erro ao carregar jornada personalizada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchPersonalizedJourney();
  }, [sentimentId, intentionId]);

  const handleOption = (option: JourneyOption) => {
    console.log('🎯 Opção selecionada:', {
      optionId: option.id,
      text: option.text,
      nextStepId: option.nextStepId,
      isEndState: option.isEndState,
      hasMovieSuggestions: option.movieSuggestions?.length || 0
    });

    if (option.isEndState) {
      const movies = option.movieSuggestions || [];
      console.log('🎬 Estado final alcançado, filmes sugeridos:', movies.length);
      setAllMovies(movies);
      setCurrentPage(0);
      setSuggestedMovies(movies.slice(0, moviesPerPage));
      return;
    }

    if (!option.nextStepId) {
      console.error('❌ NextStepId não encontrado para opção não-final');
      alert('Erro: próximo passo não definido.');
      return;
    }

    // Buscar próximo step
    const next = allSteps.find(s => s.stepId === option.nextStepId || s.id?.toString() === option.nextStepId);
    
    if (next) {
      console.log('✅ Próximo step encontrado:', next.stepId);
      setStep(next);
      setCurrentStepId(next.stepId);
    } else {
      console.error('❌ Próximo step não encontrado:', {
        nextStepId: option.nextStepId,
        availableSteps: allSteps.map(s => ({ id: s.id, stepId: s.stepId }))
      });
      alert(`Erro ao avançar: próximo passo '${option.nextStepId}' não encontrado`);
    }
  };

  const renderOptions = () => {
    if (!step) return null;
    
    // Layout em duas colunas para gêneros (step 38)
    if (step.id === 38) {
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
              <Text style={styles.genreOptionText} numberOfLines={1}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // Layout padrão para outras opções
    return step.options.map(option => (
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
        <Text style={styles.optionText}>{option.text}</Text>
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} />
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
        <AppHeader showBack={true} />
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

  if (suggestedMovies) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} />
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.movieResultsContainer}>
          {/* Header melhorado */}
          <View style={styles.resultsHeader}>
            <View style={styles.journeyIndicator}>
              <Ionicons name="sparkles" size={20} color={colors.primary.main} />
              <Text style={styles.journeyText}>Baseado na sua jornada emocional personalizada</Text>
            </View>
            <Text style={styles.resultsTitle}>Filmes selecionados especialmente para você</Text>
            {allMovies.length > 3 && (
              <View style={styles.movieCountIndicator}>
                <Ionicons name="film-outline" size={16} color={colors.primary.main} />
                <Text style={styles.movieCountText}>
                  {getTotalMoviesInfo().total} filmes encontrados
                </Text>
              </View>
            )}
          </View>

          {suggestedMovies.length === 0 && (
            <Text style={styles.errorText}>Nenhum filme sugerido para este caminho.</Text>
          )}
          {suggestedMovies.map((ms, idx) => (
            <Pressable
              key={ms.movie.id + idx}
              style={({ pressed }) => [
                styles.movieCard,
                pressed && styles.movieCardPressed
              ]}
              onPress={() => {
                console.log('Navegando para filme:', {
                  id: ms.movie.id,
                  reason: ms.reason
                });
                router.push({
                  pathname: '/filme/[id]',
                  params: { 
                    id: ms.movie.id,
                    reason: ms.reason
                  }
                });
              }}
            >
              <View style={styles.movieContent}>
                {ms.movie.thumbnail && (
                  <Image source={{ uri: ms.movie.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                )}
                <View style={styles.movieInfo}>
                  <Text style={styles.movieTitle} numberOfLines={2}>{ms.movie.title}</Text>
                  <View style={styles.movieDetails}>
                    {ms.movie.vote_average !== undefined && ms.movie.vote_average !== null && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color={colors.yellow} />
                        <Text style={styles.ratingText}>
                          {typeof ms.movie.vote_average === 'number' 
                            ? ms.movie.vote_average.toFixed(1)
                            : ms.movie.vote_average}
                        </Text>
                      </View>
                    )}
                    {ms.movie.runtime && (
                      <View style={styles.runtimeContainer}>
                        <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.runtimeText}>
                          {ms.movie.runtime} min
                        </Text>
                      </View>
                    )}
                    {ms.movie.certification && (
                      <View style={styles.certificationContainer}>
                        <Text style={styles.certificationText}>{ms.movie.certification}</Text>
                      </View>
                    )}
                  </View>
                  {ms.movie.genres && ms.movie.genres.length > 0 && (
                    <Text style={styles.genresText} numberOfLines={1}>
                      {ms.movie.genres.join(' • ')}
                    </Text>
                  )}
                  <View style={styles.reasonContainer}>
                    <View style={styles.reasonContent}>
                      <Ionicons name="heart" size={16} color={colors.primary.main} />
                      <Text style={styles.reasonText} numberOfLines={2}>
                        {ms.reason}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.primary.main} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <NavigationFooter 
          backLabel="Nova Jornada" 
          showHome={!hasMoreMovies()}
          showLoadMore={hasMoreMovies()}
          onLoadMore={loadMoreMovies}
          loadMoreLabel={`Ver Mais (${getTotalMoviesInfo().currentlyShowing}/${getTotalMoviesInfo().total})`}
        />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} />
      <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          step?.id === 38 && styles.genreContainer
        ]}
      >
        {/* Header da pergunta */}
        <View style={styles.questionHeader}>
          <Text style={styles.question}>{step?.question}</Text>
          
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
      <NavigationFooter backLabel="Trocar Intenção" />
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
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
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
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.md,
  },
  optionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.primary.main,
    fontSize: typography.fontSize.body,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  errorText: {
    color: colors.state.error,
    fontSize: typography.fontSize.body,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  movieCard: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  movieContent: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  thumbnail: {
    width: 100,
    height: 150,
    borderRadius: borderRadius.md,
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
  movieDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
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
  movieCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
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
  genreContainer: {
    paddingTop: spacing.md,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  genreOption: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: CARD_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  genreOptionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: typography.fontSize.small * typography.lineHeight.normal,
  },
  // Novos estilos para a tela de resultados
  movieResultsContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  resultsHeader: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  journeyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  journeyText: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  resultsTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  movieCountIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  movieCountText: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  // Estilo para badge de contexto
}); 