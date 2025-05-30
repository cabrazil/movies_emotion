import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { API_ENDPOINTS } from '../config';

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
  description?: string;
  streamingPlatforms?: string[];
}

export default function MovieDetailsScreen() {
  const { id, reason } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        console.log('Buscando filme com ID:', id);
        const url = `${API_ENDPOINTS.movies.detail(id.toString())}`;
        console.log('URL da requisição:', url);
        
        const res = await fetch(url);
        console.log('Status da resposta:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error('Erro na resposta:', errorData);
          throw new Error(errorData?.error || 'Erro ao carregar filme');
        }
        
        const data = await res.json();
        console.log('Dados do filme:', data);
        setMovie(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro detalhado:', err);
        setError(`Erro ao carregar filme: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleShare = async () => {
    if (!movie) return;
    
    try {
      await Share.share({
        message: `Confira o filme "${movie.title}" (${movie.year}) - ${movie.description}`,
        title: movie.title,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando filme...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Filme não encontrado'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {movie.thumbnail && (
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnailWrapper}>
            <Image 
              source={{ uri: movie.thumbnail }} 
              style={styles.thumbnail} 
              resizeMode="cover"
            />
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title}</Text>
        
        <View style={styles.detailsRow}>
          {movie.year && (
            <Text style={styles.detailText}>{movie.year}</Text>
          )}
          {movie.runtime && (
            <Text style={styles.detailText}>{movie.runtime} min</Text>
          )}
          {movie.certification && (
            <View style={styles.certificationContainer}>
              <Text style={styles.certificationText}>{movie.certification}</Text>
            </View>
          )}
          {movie.vote_average !== undefined && movie.vote_average !== null && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.yellow} />
              <Text style={styles.ratingText}>
                {typeof movie.vote_average === 'number' 
                  ? movie.vote_average.toFixed(1)
                  : movie.vote_average}
              </Text>
            </View>
          )}
        </View>

        {movie.director && (
          <Text style={styles.directorText}>Diretor: {movie.director}</Text>
        )}

        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.genresTitle}>Gêneros:</Text>
            <View style={styles.genresList}>
              {movie.genres.map((genre) => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {movie.streamingPlatforms && movie.streamingPlatforms.length > 0 && (
          <View style={styles.streamingContainer}>
            <Text style={styles.streamingTitle}>Disponível em:</Text>
            <View style={styles.streamingPlatforms}>
              {movie.streamingPlatforms.map((platform) => (
                <View key={platform} style={styles.platformTag}>
                  <Text style={styles.platformText}>{platform}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonTitle}>Por que assistir?</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        )}

        {movie.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Sinopse</Text>
            <Text style={styles.descriptionText}>{movie.description}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  thumbnailContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: '70%',
    aspectRatio: 2/3,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginRight: spacing.md,
  },
  certificationContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  certificationText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  directorText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  genresContainer: {
    marginBottom: spacing.sm,
  },
  genresTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  genreText: {
    fontSize: typography.fontSize.small,
    color: colors.background.card,
    fontWeight: typography.fontWeight.medium,
  },
  streamingContainer: {
    marginBottom: spacing.sm,
  },
  streamingTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  streamingPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  platformTag: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  platformText: {
    fontSize: typography.fontSize.small,
    color: colors.background.card,
    fontWeight: typography.fontWeight.medium,
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
  loadingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.body,
    color: colors.state.error,
  },
  reasonContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reasonTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  descriptionContainer: {
    marginBottom: spacing.lg,
  },
  descriptionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
}); 