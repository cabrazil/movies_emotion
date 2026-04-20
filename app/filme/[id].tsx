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
import { CuradoriaCard } from '../components/movie-details/CuradoriaCard';
import { MovieSynopsis } from '../components/movie-details/MovieSynopsis';
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
      year?: number;
    }>;
    nominations: Array<{
      categoryName?: string;
      category?: string;
      personName?: string;
      year?: number;
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
  const { id, reason, sentimentId, intentionId, optionText, relevanceScore } = useLocalSearchParams();
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

    const vibe = movie.landingPageHook
      ? `\n\n\uD83C\uDFAD A Vibe do Filme:\n${movie.landingPageHook}`
      : '';

    // Resolver sentimento e intenção — mesma lógica do EmotionalAnalysis
    const sentimentNames: { [key: number]: string } = {
      13: 'Feliz / Alegre', 14: 'Triste', 15: 'Calmo(a)',
      16: 'Ansioso(a)', 17: 'Animado(a)', 18: 'Cansado(a)'
    };
    const intentionIdToType: { [key: number]: string } = {
      6: 'PROCESS', 7: 'TRANSFORM', 8: 'MAINTAIN', 9: 'EXPLORE',
      10: 'MAINTAIN', 11: 'EXPLORE', 12: 'PROCESS', 13: 'TRANSFORM',
      14: 'MAINTAIN', 15: 'EXPLORE', 16: 'PROCESS', 17: 'TRANSFORM',
      18: 'MAINTAIN', 19: 'EXPLORE', 20: 'TRANSFORM', 21: 'PROCESS',
      22: 'MAINTAIN', 23: 'EXPLORE', 24: 'PROCESS', 25: 'TRANSFORM',
      26: 'MAINTAIN', 27: 'EXPLORE'
    };
    const intentionNames: { [key: string]: string } = {
      'PROCESS': 'Processar', 'MAINTAIN': 'Manter',
      'TRANSFORM': 'Transformar', 'EXPLORE': 'Explorar'
    };
    const sentimentName = sentimentNames[Number(sentimentId)] || '';
    const intentionType = intentionIdToType[Number(intentionId)];
    const intentionName = intentionType ? intentionNames[intentionType] : '';

    // "Para quem está Animado(a) e quer Processar — …optionText"
    const journeyContext = optionText
      ? (() => {
          const prefix = sentimentName && intentionName
            ? `Para quem está ${sentimentName} e quer ${intentionName} \u2014 `
            : '';
          return `\n\n\uD83E\uDDED Sua jornada até este filme:\n${prefix}${optionText.toString()}`;
        })()
      : '';

    // Tags emocionais do filme
    const tags = movie.emotionalTags && movie.emotionalTags.length > 0
      ? `\n\n\uD83D\uDCA1 Este filme ressoa com quem busca:\n${movie.emotionalTags
          .slice(0, 4)
          .map(t => `\u2022 ${t.subSentiment}`)
          .join('\n')}`
      : '';

    const message =
      `\uD83C\uDFAC ${movie.title} (${movie.year})` +
      vibe +
      journeyContext +
      tags +
      `\n\n\u2728 Cada emo\u00e7\u00e3o tem um filme.\nDescubra o seu no Vibesfilm \uD83D\uDC49 https://vibesfilm.com`;

    try {
      await Share.share({
        message,
        title: `${movie.title} \u2014 Vibesfilm`,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Erro ao compartilhar:', error);
      }
    }
  }, [movie, optionText, sentimentId, intentionId]);

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
          {/* 1. Hero: Pôster + Título + Título Original + Ano + Duração + Classificação */}
          <MovieHeader
            thumbnail={movie.thumbnail}
            title={movie.title}
            year={movie.year}
            original_title={movie.original_title}
            director={movie.director}
            runtime={movie.runtime}
            certification={movie.certification}
            sentimentColor={sentimentColor}
          />

          {/* 2. Gêneros */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}>
              {movie.genres.map((g) => (
                <View key={g} style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: sentimentColor + '18',
                  borderWidth: 1,
                  borderColor: sentimentColor + '40',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: sentimentColor }}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 3. A Vibe do Filme */}
          {movie.landingPageHook && (() => {
            const hook = movie.landingPageHook!.replace(/<[^>]*>/g, '').trim();
            return hook ? (
              <View style={{
                marginHorizontal: 16,
                marginBottom: 20,
                paddingLeft: 14,
                borderLeftWidth: 3,
                borderLeftColor: sentimentColor,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: sentimentColor,
                  marginBottom: 4,
                }}>A Vibe do Filme</Text>
                <Text style={{
                  fontSize: 16,
                  fontStyle: 'italic',
                  lineHeight: 24,
                  color: colors.text.primary,
                }}>"{hook}"</Text>
              </View>
            ) : null;
          })()}

          {/* Botão Assistir Trailer */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginHorizontal: 16,
              marginBottom: 20,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: sentimentColor,
            }}
            onPress={handleTrailer}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Assistir Trailer</Text>
          </TouchableOpacity>

          {/* 4. Onde Assistir */}
          <StreamingPlatforms
            platforms={movie.platforms}
            sentimentColor={sentimentColor}
          />

          {/* 4b. Alerta de Conteúdo */}
          {movie.contentWarnings && (() => {
            const hasWarning = movie.contentWarnings !== 'Atenção: nenhum alerta de conteúdo significativo.';
            return (
              <View style={{
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: hasWarning ? colors.state.warning + '60' : '#4CAF5060',
                backgroundColor: hasWarning ? colors.state.warning + '12' : '#4CAF5012',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <Text style={{ fontSize: 16, marginTop: 1 }}>
                  {hasWarning ? '⚠️' : '✅'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    color: hasWarning ? colors.state.warning : '#4CAF50',
                    marginBottom: 4,
                  }}>
                    {hasWarning ? 'Alerta de Conteúdo' : 'Verificação de Conteúdo'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 19 }}>
                    {hasWarning
                      ? (() => { const t = movie.contentWarnings!.replace('Atenção: ', '').replace('atenção: ', ''); return t.charAt(0).toUpperCase() + t.slice(1); })()
                      : 'Nenhum alerta de conteúdo significativo identificado.'}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* 5. Curadoria VibesFilm */}
          <CuradoriaCard
            sentimentId={sentimentId}
            intentionId={typeof intentionId === 'string' ? intentionId : undefined}
            optionText={optionText}
            reason={reason}
            relevanceScore={relevanceScore ? Number(relevanceScore) : null}
            imdbRating={movie.imdbRating}
            vote_average={movie.vote_average}
            sentimentColor={sentimentColor}
          />

          {/* 6. Sinopse + Direção */}
          <MovieSynopsis
            description={movie.description}
            director={movie.director}
            sentimentColor={sentimentColor}
          />

          {/* 7. Elenco Principal (4 nomes) */}
          <MovieCast
            mainCast={movie.mainCast}
            sentimentColor={sentimentColor}
          />

          {/* 8. Reconhecimento (Oscar) */}
          <MovieAwards
            title={movie.title}
            oscarAwards={movie.oscarAwards}
            awardsSummary={movie.awardsSummary}
            sentimentColor={sentimentColor}
          />

          {/* Compartilhar */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.primary.main} />
              <Text style={styles.actionButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showScrollIndicator && (
          <Animated.View
            style={[
              styles.scrollIndicator,
              { opacity: scrollIndicatorOpacity, borderColor: sentimentColor + '40' }
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