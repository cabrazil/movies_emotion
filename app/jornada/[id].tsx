import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../config';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: string;
  title: string;
  thumbnail?: string;
  year?: number;
  director?: string;
  vote_average?: number;
  certification?: string;
  genres?: string[];
  runtime?: number;
}

interface MovieSuggestion {
  reason: string;
  movie: Movie;
}

interface JourneyOption {
  id: number;
  text: string;
  nextStepId: string | null;
  isEndState: boolean;
  movieSuggestions?: MovieSuggestion[];
}

interface JourneyStep {
  id: number;
  question: string;
  options: JourneyOption[];
  stepId?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.xs;
const CARD_WIDTH = (SCREEN_WIDTH - (2 * spacing.md) - CARD_MARGIN) / 2;
const CARD_HEIGHT = 45;

export default function JornadaScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<JourneyStep | null>(null);
  const [allSteps, setAllSteps] = useState<JourneyStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [suggestedMovies, setSuggestedMovies] = useState<MovieSuggestion[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.mainSentiments.detail(id.toString())}`);
        if (!res.ok) {
          throw new Error('Erro ao carregar jornada');
        }
        const data = await res.json();
        const steps = data.journeyFlow?.steps || [];
        setAllSteps(steps);
        if (steps.length > 0) {
          setStep(steps[0]);
          setCurrentStepId(steps[0].stepId || steps[0].id?.toString());
        } else {
          throw new Error('Nenhum passo encontrado na jornada');
        }
        setLoading(false);
      } catch (err: unknown) {
        console.error('Erro detalhado:', err);
        setError(`Erro ao carregar jornada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchJourney();
  }, [id]);

  const handleOption = (option: JourneyOption) => {
    if (option.isEndState) {
      const movies = option.movieSuggestions || [];
      setSuggestedMovies(movies);
      return;
    }
    const next = allSteps.find(s => s.stepId === option.nextStepId || s.id?.toString() === option.nextStepId);
    if (next) {
      setStep(next);
      setCurrentStepId(next.stepId || next.id?.toString());
    } else {
      alert('Próxima etapa não encontrada.');
    }
  };

  const renderOptions = () => {
    if (!step) return null;
    
    if (step.id === 38) {
      // Layout em duas colunas para gêneros
      return (
        <View style={styles.genreGrid}>
          {step.options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={styles.genreOption}
              onPress={() => handleOption(option)}
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
        style={styles.option}
        onPress={() => handleOption(option)}
      >
        <Text style={styles.optionText}>{option.text}</Text>
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Carregando jornada...</Text>
      </View>
    );
  }

  if (error || !step) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Jornada não encontrada'}</Text>
      </View>
    );
  }

  if (suggestedMovies) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.question}>Sugestões de filmes para você:</Text>
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
                  <Text style={styles.reasonText} numberOfLines={2}>
                    {ms.reason}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container,
        step?.id === 38 && styles.genreContainer
      ]}
    >
      <Text style={styles.question}>{step?.question}</Text>
      {renderOptions()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  question: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  option: {
    width: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  optionText: {
    color: colors.background.card,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
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
    width: 80,
    height: 120,
    borderRadius: borderRadius.sm,
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
  reasonText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginRight: spacing.xs,
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
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: CARD_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  genreOptionText: {
    color: colors.background.card,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: typography.fontSize.small * typography.lineHeight.normal,
  },
}); 