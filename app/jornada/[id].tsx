import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../config';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface Movie {
  id: string;
  title: string;
  thumbnail?: string;
  year?: number;
  director?: string;
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
          <View key={ms.movie.id + idx} style={styles.movieCard}>
            {ms.movie.thumbnail && (
              <Image source={{ uri: ms.movie.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            )}
            <Text style={styles.movieTitle}>{ms.movie.title}</Text>
            <View style={styles.movieTextContent}>
              <Text style={styles.movieReason}>{ms.reason}</Text>
              {ms.movie.year && <Text style={styles.movieInfo}>Ano: {ms.movie.year}</Text>}
              {ms.movie.director && <Text style={styles.movieInfo}>Diretor: {ms.movie.director}</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.question}>{step.question}</Text>
      {step.options.map(option => (
        <TouchableOpacity
          key={option.id}
          style={styles.option}
          onPress={() => handleOption(option)}
        >
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
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
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  movieTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.main,
    marginBottom: spacing.sm,
    textAlign: 'left',
    lineHeight: typography.fontSize.h3 * typography.lineHeight.tight,
  },
  movieTextContent: {
    width: '100%',
    alignItems: 'flex-start',
  },
  movieReason: {
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'left',
    lineHeight: typography.fontSize.bodySmall * typography.lineHeight.relaxed,
  },
  movieInfo: {
    fontSize: typography.fontSize.small,
    color: colors.text.light,
    lineHeight: typography.fontSize.small * typography.lineHeight.normal,
  },
}); 