import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface MovieHeaderProps {
  thumbnail?: string | null;
  title: string;
  year?: number | null;
  original_title?: string | null;
  director?: string | null;
  runtime?: number | null;
  certification?: string | null;
  sentimentColor: string;
  onTrailerPress: () => void;
}

export const MovieHeader: React.FC<MovieHeaderProps> = React.memo(({
  thumbnail,
  title,
  year,
  original_title,
  director,
  runtime,
  certification,
  sentimentColor,
  onTrailerPress
}) => {
  const { colors } = useTheme();

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const styles = useMemo(() => StyleSheet.create({
    movieHeader: {
      flexDirection: 'row',
      padding: spacing.md,
      backgroundColor: colors.background.primary,
    },
    posterContainer: {
      marginRight: spacing.md,
    },
    poster: {
      width: 120,
      height: 180,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.secondary,
    },
    movieInfo: {
      flex: 1,
      justifyContent: 'space-between',
    },
    titleSection: {
      marginBottom: spacing.sm,
    },
    movieTitle: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    movieYear: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.medium,
    },
    originalTitle: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.regular,
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
    movieMeta: {
      marginBottom: spacing.md,
    },
    metaText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    runtimeCertificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      flexWrap: 'wrap',
    },
    metaSeparator: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      marginHorizontal: spacing.sm,
    },
    certificationText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
    },
    trailerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      alignSelf: 'center',
      width: '100%',
    },
    trailerButtonText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.inverse,
      marginLeft: spacing.xs,
    },
  }), [colors]);

  return (
    <View style={styles.movieHeader}>
      {thumbnail && (
        <View style={styles.posterContainer}>
          <Image 
            source={{ uri: thumbnail }} 
            style={styles.poster} 
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.movieInfo}>
        <View style={styles.titleSection}>
          <Text style={styles.movieTitle}>{title}</Text>
          {year && (
            <Text style={[styles.movieYear, { color: sentimentColor }]}>({year})</Text>
          )}
          {original_title && (
            <Text style={styles.originalTitle}>Título Original: {original_title}</Text>
          )}
        </View>
        
        <View style={styles.movieMeta}>
          {director && (
            <Text style={styles.metaText}>Diretor: {director}</Text>
          )}
          
          <View style={styles.runtimeCertificationRow}>
            {runtime && (
              <Text style={styles.metaText}>
                {formatRuntime(runtime)}
              </Text>
            )}
            {certification && (
              <>
                <Text style={styles.metaSeparator}>|</Text>
                <Text style={[styles.certificationText, { color: sentimentColor }]}>
                  {certification}
                </Text>
              </>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.trailerButton, { backgroundColor: sentimentColor }]} 
          onPress={onTrailerPress}
        >
          <Ionicons name="play-circle" size={20} color={colors.text.inverse} />
          <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

MovieHeader.displayName = 'MovieHeader';

