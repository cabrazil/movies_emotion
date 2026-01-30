import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Animated, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { API_ENDPOINTS, apiRequest } from '../config';
import { NavigationFooter } from '../components/NavigationFooter';
import { AppHeader } from '../components/AppHeader';
import { MovieHeader } from '../components/movie-details/MovieHeader';
import { StreamingPlatforms } from '../components/movie-details/StreamingPlatforms';
import { EmotionalAnalysis } from '../components/movie-details/EmotionalAnalysis';
import { MovieSynopsis } from '../components/movie-details/MovieSynopsis';
import { RatingsAndGenres } from '../components/movie-details/RatingsAndGenres';
import { MovieCast } from '../components/movie-details/MovieCast';
import { MovieAwards } from '../components/movie-details/MovieAwards';

interface StreamingPlatform {
  id: number;
  name: string;
  logoPath: string;
  category: string;
  hasFreeTrial: boolean;
  freeTrialDuration?: number;
  baseUrl?: string;
}

interface MoviePlatform {
  accessType: string;
  streamingPlatform: StreamingPlatform;
}

interface Movie {
  id: string;
  title: string;
  original_title?: string;
  thumbnail?: string;
  year?: number;
  director?: string;
  vote_average?: number;
  certification?: string;
  genres?: string[];
  runtime?: number;
  description?: string;
  streamingPlatforms?: string[];
  platforms?: MoviePlatform[];
  imdbRating?: number;
  imdb_rating?: number;
  rottenTomatoesRating?: number;
  metacriticRating?: number;
  landingPageHook?: string;
  targetAudienceForLP?: string;
  contentWarnings?: string;
  mainCast?: Array<{
    actorName: string;
    characterName?: string;
  }>;
  oscarAwards?: {
    wins: Array<{
      categoryName?: string;
      category?: string;
      personName?: string;
      year?: string;
    }>;
    nominations: Array<{
      categoryName?: string;
      category?: string;
      personName?: string;
      year?: string;
    }>;
  };
  awardsSummary?: string;
  mainTrailer?: {
    key: string;
    name?: string;
    site: string;
    type?: string;
    language?: string;
    isMain?: boolean;
  } | null;
  emotionalTags?: Array<{
    mainSentiment: string;
    subSentiment: string;
    relevance: number;
  }>;
}

export default function MovieDetailsScreen() {
  const { id, reason, sentimentId, intentionId } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { colors } = useTheme();

  // Obter cor do sentimento (memoizada)
  const sentimentColor = useMemo(() =>
    sentimentId ? (colors.sentimentColors[Number(sentimentId)] || colors.primary.main) : colors.primary.main,
    [sentimentId, colors]
  );

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        if (__DEV__) {
          console.log('🎬 Buscando filme:', id);
        }
        const url = `${API_ENDPOINTS.movies.detail(id.toString())}`;

        const res = await apiRequest(url);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          if (__DEV__) {
            console.error('❌ Erro ao carregar filme:', errorData);
          }
          throw new Error(errorData?.error || 'Erro ao carregar filme');
        }

        const data = await res.json();

        // O endpoint /api/movie/{id}/details retorna { movie: {...}, subscriptionPlatforms: [...] }
        const movieData = data.movie || data;
        const platforms = data.subscriptionPlatforms || data.platforms || [];

        if (__DEV__) {
          console.log('✅ Filme carregado:', movieData.title || movieData.original_title);
        }

        // Mapear os dados para o formato esperado pelo mobile
        const processedMovieData = {
          id: movieData.id,
          title: movieData.title,
          original_title: movieData.original_title,
          thumbnail: movieData.thumbnail,
          year: movieData.year,
          director: movieData.director,
          vote_average: movieData.vote_average,
          certification: movieData.certification,
          genres: movieData.genres,
          runtime: movieData.runtime,
          description: movieData.description,
          platforms: platforms,
          imdbRating: movieData.imdbRating,
          imdb_rating: movieData.imdb_rating,
          rottenTomatoesRating: movieData.rottenTomatoesRating,
          metacriticRating: movieData.metacriticRating,
          landingPageHook: movieData.landingPageHook,
          targetAudienceForLP: movieData.targetAudienceForLP,
          contentWarnings: movieData.contentWarnings,
          mainCast: movieData.mainCast,
          oscarAwards: movieData.oscarAwards,
          awardsSummary: movieData.awardsSummary,
          mainTrailer: movieData.mainTrailer,
          emotionalTags: movieData.emotionalTags,
        };

        setMovie(processedMovieData);
        setLoading(false);
      } catch (err) {
        if (__DEV__) {
          console.error('Erro detalhado:', err);
        }
        setError(`Erro ao carregar filme: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Mostrar indicador de scroll inicialmente se há conteúdo
  useEffect(() => {
    if (movie && !loading) {
      // Pequeno delay para garantir que o layout foi renderizado
      const timer = setTimeout(() => {
        setShowScrollIndicator(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [movie, loading]);

  const handleShare = useCallback(async () => {
    if (!movie) return;

    try {
      await Share.share({
        message: `Confira o filme "${movie.title}" (${movie.year}) - ${movie.description}`,
        title: movie.title,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Erro ao compartilhar:', error);
      }
    }
  }, [movie]);

  const handleTrailer = useCallback(async () => {
    if (!movie?.mainTrailer) {
      Alert.alert(
        'Trailer não disponível',
        'Este filme não possui trailer disponível no momento.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { mainTrailer } = movie;
    const trailerKey = mainTrailer.key;

    // Construir URL do YouTube
    // Tentar abrir no app do YouTube primeiro, depois no navegador
    const youtubeAppUrl = `vnd.youtube:${trailerKey}`;
    const youtubeWebUrl = `https://www.youtube.com/watch?v=${trailerKey}`;

    try {
      // Tentar abrir no app do YouTube
      const canOpen = await Linking.canOpenURL(youtubeAppUrl);

      if (canOpen) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        // Se não conseguir abrir o app, abrir no navegador
        await Linking.openURL(youtubeWebUrl);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Erro ao abrir trailer:', error);
      }

      // Fallback: tentar abrir no navegador diretamente
      try {
        await Linking.openURL(youtubeWebUrl);
      } catch (fallbackError) {
        Alert.alert(
          'Erro',
          'Não foi possível abrir o trailer. Verifique sua conexão com a internet.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [movie]);

  // Função para lidar com o scroll (memoizada) - DEVE estar antes de qualquer early return
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrolledToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;

    if (isScrolledToBottom) {
      // Fazer o indicador desaparecer suavemente
      Animated.timing(scrollIndicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowScrollIndicator(false);
      });
    } else {
      // Mostrar o indicador se não estiver no final
      setShowScrollIndicator((prev) => {
        if (!prev) {
          Animated.timing(scrollIndicatorOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          return true;
        }
        return prev;
      });
    }
  }, [scrollIndicatorOpacity]);

  // Criar estilos dinamicamente com base no tema
  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    fullContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    loadingText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
    },
    errorText: {
      fontSize: typography.fontSize.body,
      color: colors.state.error,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    actionButtonText: {
      fontSize: typography.fontSize.body,
      color: colors.primary.main,
      fontWeight: typography.fontWeight.medium,
      marginLeft: spacing.xs,
    },
    scrollIndicator: {
      position: 'absolute',
      bottom: 100,
      left: '50%',
      marginLeft: -25,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.background.card,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      elevation: 8,
    },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando filme...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Filme não encontrado'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.fullContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <MovieHeader
            thumbnail={movie.thumbnail}
            title={movie.title}
            year={movie.year}
            original_title={movie.original_title}
            director={movie.director}
            runtime={movie.runtime}
            certification={movie.certification}
            sentimentColor={sentimentColor}
            onTrailerPress={handleTrailer}
          />

          <StreamingPlatforms
            platforms={movie.platforms}
            sentimentColor={sentimentColor}
          />

          <EmotionalAnalysis
            title={movie.title}
            contentWarnings={movie.contentWarnings}
            landingPageHook={movie.landingPageHook}
            targetAudienceForLP={movie.targetAudienceForLP}
            sentimentId={sentimentId}
            intentionId={typeof intentionId === 'string' ? intentionId : undefined}
            reason={reason}
            sentimentColor={sentimentColor}
            emotionalTags={movie.emotionalTags}
          />

          <MovieSynopsis
            description={movie.description}
            sentimentColor={sentimentColor}
          />

          <RatingsAndGenres
            vote_average={movie.vote_average}
            imdbRating={movie.imdbRating}
            imdb_rating={movie.imdb_rating}
            rottenTomatoesRating={movie.rottenTomatoesRating}
            metacriticRating={movie.metacriticRating}
            genres={movie.genres}
            sentimentColor={sentimentColor}
          />

          <MovieCast
            mainCast={movie.mainCast}
            sentimentColor={sentimentColor}
          />

          <MovieAwards
            title={movie.title}
            oscarAwards={movie.oscarAwards}
            awardsSummary={movie.awardsSummary}
            sentimentColor={sentimentColor}
          />

          {/* Botão de Compartilhar */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.primary.main} />
              <Text style={styles.actionButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Indicador de Scroll */}
        {showScrollIndicator && (
          <Animated.View
            style={[
              styles.scrollIndicator,
              {
                opacity: scrollIndicatorOpacity,
                borderColor: sentimentColor + '40'
              }
            ]}
          >
            <Ionicons name="chevron-down" size={24} color={sentimentColor} />
          </Animated.View>
        )}

        <NavigationFooter backLabel="Filmes" showHome={true} />
      </View>
    </SafeAreaView>
  );
} 