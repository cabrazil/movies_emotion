import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Pressable, Platform as RNPlatform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, apiRequest } from './config';
import { HOME_GRADIENT } from './components/premium/GradientBackground';
import { GlassCard } from './components/premium/GlassCard';
import { typography, spacing, borderRadius, shadows } from './theme';

// Helper to construct image URL
const getCloudflareImageUrl = (path: string | null) => {
  if (!path) return 'https://moviesf-back.vercel.app/placeholder-movie.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('dadrodpfylduydjbdxpy.supabase.co')) {
      return path.replace(
        'https://dadrodpfylduydjbdxpy.supabase.co/storage/v1/object/public/movie-images',
        'https://images.vibesfilm.com'
      );
    }
    return path;
  }
  return `https://image.tmdb.org/t/p/w500${path}`;
};

export default function DailyCurationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [curationData, setCurationData] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = 'rgba(150, 170, 255, 0.8)'; // Cor de destaque para alinhar com a Home

  useEffect(() => {
    fetchDailyCuration();
  }, []);

  const fetchDailyCuration = async () => {
    try {
      setLoading(true);
      // 1. Busca a curadoria do dia
      const response = await apiRequest(API_ENDPOINTS.dailyCuration.today);
      const data = await response.json();
      setCurationData(data);

      if (data.movieIds && data.movieIds.length > 0) {
        // 2. Busca os detalhes de cada filme em paralelo
        const moviePromises = data.movieIds.map((id: string) =>
          apiRequest(API_ENDPOINTS.movies.detail(id)).then(res => res.json())
        );
        const moviesResults = await Promise.all(moviePromises);
        
        // Formata os filmes para uso na UI
        const formattedMovies = moviesResults.map(res => ({
          ...res.movie,
          platforms: res.subscriptionPlatforms || []
        }));
        setMovies(formattedMovies);
      }
    } catch (err) {
      console.error('Erro ao carregar curadoria diária:', err);
      setError('Não foi possível carregar a curadoria de hoje.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={HOME_GRADIENT} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backCircle} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Preparando curadoria do dia...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !curationData || movies.length === 0) {
    return (
      <LinearGradient colors={HOME_GRADIENT} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backCircle} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || 'Nenhuma curadoria disponível no momento.'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDailyCuration}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={HOME_GRADIENT} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Premium */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{curationData.buttonTitle || 'Vibe do Dia'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Frase Emocional do Dia */}
          <View style={styles.phraseContainer}>
            <Ionicons name="sparkles" size={20} color={primaryColor} style={{ marginBottom: 8 }} />
            <Text style={styles.phraseText}>
              {curationData.headerPhrase}
            </Text>
          </View>

          <View style={styles.moviesContainer}>
            {movies.map((movie, index) => {
              const isMainHighlight = index === 0;

              return (
                <GlassCard
                  key={movie.id + index}
                  intensity={isMainHighlight ? 25 : 12}
                  borderColor={isMainHighlight ? primaryColor : 'rgba(255,255,255,0.3)'}
                  borderWidth={isMainHighlight ? 1.5 : 1}
                  borderRadius={16}
                  style={[styles.glassCardWrapper, isMainHighlight && styles.mainHighlightCard]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.movieCard,
                      pressed && styles.movieCardPressed
                    ]}
                    onPress={() => {
                      router.push({
                        pathname: '/filme/[id]',
                        params: {
                          id: movie.id,
                          reason: curationData.headerPhrase
                        }
                      });
                    }}
                  >
                    <View style={styles.movieContent}>
                      {movie.thumbnail && (
                        <Image source={{ uri: getCloudflareImageUrl(movie.thumbnail) }} style={styles.thumbnail} resizeMode="cover" />
                      )}
                      
                      <View style={styles.movieInfo}>
                        <View>
                          {isMainHighlight && (
                            <View style={styles.highlightBadge}>
                              <Ionicons name="star" size={12} color="#FFFFFF" />
                              <Text style={styles.highlightBadgeText}>Escolha Principal</Text>
                            </View>
                          )}
                          <Text style={styles.movieTitle} numberOfLines={2}>
                            {movie.title}
                          </Text>

                          {/* Metadados: Ano • Duração • Classificação • Rating */}
                          <View style={styles.movieDetails}>
                            <Text style={styles.metaText}>{movie.year || 'N/A'}</Text>

                            {movie.runtime && movie.runtime > 0 && (
                              <>
                                <Text style={styles.bulletPoint}>•</Text>
                                <Text style={styles.metaText}>
                                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                </Text>
                              </>
                            )}

                            {movie.certification && (
                              <>
                                <Text style={styles.bulletPoint}>•</Text>
                                <View style={styles.certificationContainer}>
                                  <Text style={styles.certificationText}>
                                    {movie.certification}
                                  </Text>
                                </View>
                              </>
                            )}

                            {movie.imdbRating && (
                              <>
                                <Text style={styles.bulletPoint}>•</Text>
                                <View style={styles.ratingContainer}>
                                  <Text style={styles.imdbLabel}>IMDb</Text>
                                  <Ionicons name="star" size={10} color="#F5C518" style={{ marginRight: 2 }} />
                                  <Text style={styles.metaText}>{Number(movie.imdbRating).toFixed(1)}</Text>
                                </View>
                              </>
                            )}
                          </View>
                        </View>

                        {/* Plataformas (se houver) */}
                        {movie.platforms && movie.platforms.length > 0 ? (
                          <View style={styles.platformBadgesContainer}>
                            <View style={[styles.platformBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                              <Text style={[styles.platformBadgeText, { color: '#FFFFFF' }]}>
                                No {movie.platforms[0].name.replace(' (Loja)', '')}
                              </Text>
                            </View>
                            {movie.platforms.length > 1 && (
                              <Text style={styles.extraPlatformsText}>+{movie.platforms.length - 1}</Text>
                            )}
                          </View>
                        ) : (
                          <View style={styles.platformBadgesContainer}>
                            <View style={[styles.platformBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                              <Text style={[styles.platformBadgeText, { color: 'rgba(255,255,255,0.8)' }]}>
                                Somente aluguel/compra
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  phraseContainer: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  phraseText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  moviesContainer: {
    gap: 16,
  },
  glassCardWrapper: {
    marginBottom: 16,
  },
  mainHighlightCard: {
    shadowColor: 'rgba(150, 170, 255, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  movieCard: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  movieCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  movieContent: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 170, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  highlightBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  bulletPoint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
  },
  certificationContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certificationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imdbLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 3,
  },
  platformBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  platformBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  extraPlatformsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
