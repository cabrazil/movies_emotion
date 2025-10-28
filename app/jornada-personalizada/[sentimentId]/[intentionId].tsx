import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Pressable, Dimensions, SafeAreaView, Animated } from 'react-native';
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
  const { sentimentId, intentionId, optionId, platforms, showResults } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<PersonalizedJourneyStep | null>(null);
  const [allSteps, setAllSteps] = useState<PersonalizedJourneyStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [allMovies, setAllMovies] = useState<MovieSuggestion[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]);
  const [platformsData, setPlatformsData] = useState<Record<number, string>>({});
  const router = useRouter();

  // Obter cor do sentimento
  const sentimentColor = colors.sentimentColors[Number(sentimentId)] || colors.primary.main;
  
  // Animação do indicador de scroll
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const getTotalMoviesInfo = () => {
    const total = allMovies.length;
    return { total };
  };

  // Buscar dados das plataformas para mapeamento dinâmico
  useEffect(() => {
    const fetchPlatformsData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.streamingPlatforms.list);
        if (response.ok) {
          const platforms = await response.json();
          const platformsMap: Record<number, string> = {};
          platforms.forEach((platform: any) => {
            platformsMap[platform.id] = platform.name;
          });
          setPlatformsData(platformsMap);
        }
      } catch (error) {
        console.error('Erro ao carregar dados das plataformas:', error);
      }
    };
    
    fetchPlatformsData();
  }, []);

  useEffect(() => {
    const fetchPersonalizedJourney = async () => {
      try {
        console.log('🚀 Carregando jornada personalizada:', { sentimentId, intentionId });
        
             const res = await fetch(API_ENDPOINTS.personalizedJourney.get(sentimentId.toString(), intentionId.toString()), {
               headers: {
                 'Cache-Control': 'no-cache',
                 'Pragma': 'no-cache'
               }
             });
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

  // Processar retorno da tela de plataformas
  useEffect(() => {
    if (showResults === 'true' && optionId && allSteps.length > 0) {
      console.log('🔄 Retornando da tela de plataformas:', { optionId, platforms });
      
      // Parsear plataformas selecionadas
      let platformIds: number[] = [];
      if (platforms && typeof platforms === 'string' && platforms.length > 0) {
        platformIds = platforms.split(',').map(id => parseInt(id, 10));
        setSelectedPlatformIds(platformIds);
        console.log('📺 Plataformas selecionadas:', platformIds);
      }
      
      // Buscar a opção que foi selecionada para pegar os filmes
      const option = allSteps
        .flatMap(s => s.options)
        .find(o => o.id.toString() === optionId.toString());
      
      if (option && option.isEndState && option.movieSuggestions) {
        let movies = option.movieSuggestions;
        console.log('🎬 Total de filmes antes do filtro:', movies.length);
        
        // Debug: verificar estrutura dos filmes
        if (movies.length > 0) {
          const firstMovie = movies[0];
          console.log('🔍 Estrutura do primeiro filme:', {
            id: firstMovie.movie.id,
            title: firstMovie.movie.title,
            hasPlatforms: !!firstMovie.movie.platforms,
            platformsCount: firstMovie.movie.platforms?.length || 0,
            platforms: firstMovie.movie.platforms?.map(p => ({
              streamingPlatformId: p.streamingPlatformId,
              platformId: (p as any).platformId,
              id: (p as any).id,
              accessType: p.accessType,
              allKeys: Object.keys(p)
            }))
          });
        }
        
        // Filtrar filmes por plataformas se houver seleção
        if (platformIds.length > 0) {
          console.log('🔍 Iniciando filtro com plataformas:', platformIds);
          
          movies = movies.filter(suggestion => {
            // Verificar se o filme tem plataformas
            if (!suggestion.movie.platforms || suggestion.movie.platforms.length === 0) {
              console.log(`❌ Filme "${suggestion.movie.title}" sem plataformas`);
              return false;
            }
            
            // Verificar se o filme está disponível em alguma das plataformas selecionadas
            // com acesso por assinatura (INCLUDED_WITH_SUBSCRIPTION)
            // SOLUÇÃO: Usar nomes de plataforma (igual ao web) em vez de IDs
            const hasSelectedPlatform = suggestion.movie.platforms.some(platform => {
              const platformName = platform.streamingPlatform?.name;
              
              if (!platformName) {
                console.log(`⚠️ Plataforma sem nome no filme "${suggestion.movie.title}"`);
                return false;
              }
              
              // Mapear IDs para nomes das plataformas selecionadas
              const selectedPlatformNames = platformIds.map(id => {
                // Mapear IDs conhecidos para nomes (baseado na API /streaming-platforms)
                const idToNameMap: Record<number, string> = {
                  32: 'Netflix',
                  33: 'Prime Video', 
                  34: 'Disney+',
                  35: 'HBO Max',
                  36: 'Paramount+',
                  37: 'Apple TV+',
                  38: 'Globoplay',
                  39: 'Claro Video',
                  43: 'Telecine',
                };
                return idToNameMap[id];
              }).filter(Boolean);
              
              const isMatch = selectedPlatformNames.includes(platformName) &&
                              platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION';
              
              if (isMatch) {
                console.log(`✅ Match encontrado: Filme "${suggestion.movie.title}" - Plataforma "${platformName}"`);
              }
              
              return isMatch;
            });
            
            if (hasSelectedPlatform) {
              console.log(`✅ Filme "${suggestion.movie.title}" disponível em plataforma selecionada`);
            } else {
              console.log(`❌ Filme "${suggestion.movie.title}" não disponível nas plataformas selecionadas`);
            }
            
            return hasSelectedPlatform;
          });
          
          console.log('📺 Filmes após filtro de plataformas:', movies.length);
        }
        
               setAllMovies(movies);
      }
    }
  }, [showResults, optionId, platforms, allSteps]);

  const handleOption = (option: JourneyOption) => {
    console.log('🎯 Opção selecionada:', {
      optionId: option.id,
      text: option.text,
      nextStepId: option.nextStepId,
      isEndState: option.isEndState,
      hasMovieSuggestions: option.movieSuggestions?.length || 0
    });

    if (option.isEndState) {
      console.log('🎬 Estado final alcançado, redirecionando para plataformas de streaming');
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
      
      // Mostrar indicador se houver mais de 4 opções (exceto para gêneros que tem layout especial)
      if (next.id !== 38 && next.options.length > 4) {
        setShowScrollIndicator(true);
        scrollIndicatorOpacity.setValue(1);
      } else {
        setShowScrollIndicator(false);
      }
    } else {
      console.error('❌ Próximo step não encontrado:', {
        nextStepId: option.nextStepId,
        availableSteps: allSteps.map(s => ({ id: s.id, stepId: s.stepId }))
      });
      alert(`Erro ao avançar: próximo passo '${option.nextStepId}' não encontrado`);
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

  if (allMovies.length > 0) {
    // Buscar o texto da opção escolhida
    const selectedOption = allSteps
      .flatMap(s => s.options)
      .find(o => o.id.toString() === optionId.toString());
    
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} />
      <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.movieResultsContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
          {/* Header simplificado */}
          <View style={styles.resultsHeader}>
            {/* Título com a opção escolhida */}
            {selectedOption && (
              <View style={[
                styles.selectedOptionContainer,
                { borderLeftColor: sentimentColor }
              ]}>
                <Text style={styles.selectedOptionLabel}>Filmes sugeridos para opção:</Text>
                <Text style={styles.selectedOptionText}>"{selectedOption.text}"</Text>
            </View>
            )}
            
            {/* Contador de filmes sempre visível */}
              <View style={styles.movieCountIndicator}>
                <Ionicons name="film-outline" size={16} color={colors.primary.main} />
                <Text style={styles.movieCountText}>
                  {getTotalMoviesInfo().total} filmes encontrados
                </Text>
              </View>
          </View>

          {allMovies.length === 0 && (
            <Text style={styles.errorText}>Nenhum filme sugerido para este caminho.</Text>
          )}
          {allMovies.map((ms, idx) => (
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
                    reason: ms.reason,
                    sentimentId: sentimentId
                  }
                });
              }}
            >
              <View style={styles.movieContent}>
                {ms.movie.thumbnail && (
                  <Image source={{ uri: ms.movie.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                )}
                <View style={styles.movieInfo}>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {ms.movie.title}
                    {ms.movie.year && (
                      <Text style={[styles.yearText, { color: sentimentColor }]}>
                        {' '}({ms.movie.year})
                      </Text>
                    )}
                  </Text>
                  
                  {/* Badges das plataformas */}
                  {ms.movie.platforms && ms.movie.platforms.length > 0 && (() => {
                    // Se não há plataformas selecionadas (usuário pulou a etapa), mostrar todas as plataformas de assinatura
                    if (selectedPlatformIds.length === 0) {
                      const subscriptionPlatforms = ms.movie.platforms.filter(platform => 
                        platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION' && 
                        platform.streamingPlatform?.name
                      );
                      
                      if (subscriptionPlatforms.length === 0) {
                        return null; // Não exibir nada se não há plataformas de assinatura
                      }
                      
                      return (
                        <View style={styles.platformBadgesContainer}>
                          {/* Mostrar apenas a primeira plataforma */}
                          {subscriptionPlatforms.length > 0 && (
                            <View style={[styles.platformBadge, { backgroundColor: sentimentColor + '20' }]}>
                              <Text style={[styles.platformBadgeText, { color: sentimentColor }]}>
                                {subscriptionPlatforms[0].streamingPlatform.name}
                              </Text>
                            </View>
                          )}
                          
                          {/* Badge "ver mais" se há múltiplas plataformas */}
                          {subscriptionPlatforms.length > 1 && (
                              <View style={[styles.platformBadge, { 
                                backgroundColor: colors.background.secondary,
                                borderColor: colors.border.medium,
                                borderWidth: 1,
                              }]}>
                                <Text style={[styles.platformBadgeText, { 
                                  color: colors.text.primary,
                                  fontWeight: typography.fontWeight.semibold,
                                }]}>
                                  +{subscriptionPlatforms.length - 1} mais
                                </Text>
                              </View>
                          )}
                        </View>
                      );
                    }
                    
                    // Lógica original para quando há plataformas selecionadas
                    const selectedPlatformNames = selectedPlatformIds
                      .map(id => platformsData[id])
                      .filter(Boolean);
                    
                    // Filtrar plataformas que estão nas selecionadas E são de assinatura
                    const filteredPlatforms = ms.movie.platforms.filter(platform => {
                      const platformName = platform.streamingPlatform?.name || '';
                      const isSubscription = platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION';
                      const isSelected = selectedPlatformNames.some(selectedName => {
                        const cleanSelected = selectedName.toLowerCase().trim();
                        const cleanPlatform = platformName.toLowerCase().trim();
                        return cleanPlatform.includes(cleanSelected); // Usar includes() para comparação flexível
                      });
                      
                      return isSubscription && isSelected;
                    });
                    
                    if (filteredPlatforms.length === 0) {
                      return null; // Não exibir nada se não há plataformas filtradas
                    }
                    
                    return (
                      <View style={styles.platformBadgesContainer}>
                        {/* Mostrar apenas a primeira plataforma */}
                        {filteredPlatforms.length > 0 && (
                          <View style={[styles.platformBadge, { backgroundColor: sentimentColor + '20' }]}>
                            <Text style={[styles.platformBadgeText, { color: sentimentColor }]}>
                              {filteredPlatforms[0].streamingPlatform.name}
                            </Text>
                          </View>
                        )}
                        
                        {/* Badge "ver mais" se há múltiplas plataformas */}
                        {filteredPlatforms.length > 1 && (
                            <View style={[styles.platformBadge, { 
                              backgroundColor: colors.background.secondary,
                              borderColor: colors.border.medium,
                              borderWidth: 1,
                            }]}>
                              <Text style={[styles.platformBadgeText, { 
                                color: colors.text.primary,
                                fontWeight: typography.fontWeight.semibold,
                              }]}>
                                +{filteredPlatforms.length - 1} mais
                              </Text>
                            </View>
                        )}
                      </View>
                    );
                  })()}
                  
                  <View style={styles.movieDetails}>
                    <View style={styles.ratingsContainer}>
                      {/* Nota TMDB */}
                    {ms.movie.vote_average !== undefined && ms.movie.vote_average !== null && (
                      <View style={styles.ratingContainer}>
                          <Ionicons name="library" size={16} color="#01B4E4" />
                        <Text style={styles.ratingText}>
                          {typeof ms.movie.vote_average === 'number' 
                            ? ms.movie.vote_average.toFixed(1)
                            : ms.movie.vote_average}
                        </Text>
                      </View>
                    )}
                      
                      {/* Nota IMDb */}
                      {(() => {
                        const imdbValue = ms.movie.imdbRating || ms.movie.imdb_rating;
                        const hasImdb = imdbValue !== undefined && imdbValue !== null;
                        
                        return hasImdb && (
                          <View style={styles.ratingContainer}>
                            <Ionicons name="film" size={16} color="#F5C518" />
                            <Text style={styles.ratingText}>
                              {typeof imdbValue === 'number' 
                                ? imdbValue.toFixed(1)
                                : imdbValue}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    {ms.movie.runtime && (
                      <View style={styles.runtimeContainer}>
                        <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.runtimeText}>
                          {(() => {
                            const runtime = ms.movie.runtime;
                            const hours = Math.floor(runtime / 60);
                            const minutes = runtime % 60;
                            return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                          })()}
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
                      <Ionicons name="heart" size={16} color={sentimentColor} />
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
           backgroundColor: colors.background.secondary, // Cinza intermediário
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
           borderWidth: 1,
           borderColor: colors.border.medium, // Borda equilibrada
           ...shadows.md, // Sombra equilibrada
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
  yearText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
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
         selectedOptionContainer: {
           backgroundColor: colors.background.card,
           borderRadius: borderRadius.md,
           padding: spacing.md,
           marginTop: spacing.md,
           marginBottom: spacing.sm,
           borderLeftWidth: 3,
           borderLeftColor: colors.primary.main,
         },
         selectedOptionLabel: {
           fontSize: typography.fontSize.small,
           color: colors.text.secondary,
           marginBottom: spacing.xs,
           fontWeight: typography.fontWeight.medium,
         },
         selectedOptionText: {
           fontSize: typography.fontSize.body,
           color: colors.text.primary,
           fontWeight: typography.fontWeight.semibold,
           lineHeight: typography.fontSize.body * typography.lineHeight.normal,
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
         verMaisBadge: {
           // Estilos específicos para o badge "ver mais" são aplicados inline
  },
         platformBadgeText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
         },
  // Estilo para badge de contexto
  scrollIndicator: {
    position: 'absolute',
    bottom: spacing.xl + 60, // Acima do footer
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