import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { RatingRow } from '../RatingIcon';

interface RatingsAndGenresProps {
  vote_average?: number | string | null;
  imdbRating?: string | number | null;
  imdb_rating?: string | number | null;
  rottenTomatoesRating?: number | null;
  metacriticRating?: number | null;
  genres?: string[] | null;
  sentimentColor: string;
}

export const RatingsAndGenres: React.FC<RatingsAndGenresProps> = React.memo(({
  vote_average,
  imdbRating,
  imdb_rating,
  rottenTomatoesRating,
  metacriticRating,
  genres,
  sentimentColor
}) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    ratingsGenresSection: {
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    ratingsContainer: {
      marginBottom: spacing.sm,
    },
    ratingsTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    genresContainer: {
      marginTop: spacing.md,
    },
    genresTitle: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    emotionalTag: {
      backgroundColor: colors.primary.main + '20',
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    tagText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
    },
  }), [colors]);

  return (
    <View style={styles.ratingsGenresSection}>
      <Text style={styles.sectionTitle}>Notas e Gêneros</Text>
      
      {/* Ratings */}
      <View style={styles.ratingsContainer}>
        <Text style={styles.ratingsTitle}>Notas da Crítica:</Text>
        <RatingRow 
          ratings={{
            tmdb: vote_average,
            imdb: imdbRating || imdb_rating,
            rotten: rottenTomatoesRating,
            metacritic: metacriticRating,
          }}
        />
      </View>

      {/* Gêneros */}
      {genres && genres.length > 0 && (
        <View style={styles.genresContainer}>
          <Text style={styles.genresTitle}>Gêneros:</Text>
          <View style={styles.tagsContainer}>
            {genres.map((genre) => (
              <View key={genre} style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
                <Text style={[styles.tagText, { color: sentimentColor }]}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

RatingsAndGenres.displayName = 'RatingsAndGenres';

