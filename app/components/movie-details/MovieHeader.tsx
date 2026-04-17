import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { getCloudflareImageUrl } from './movieHelpers';

interface MovieHeaderProps {
  thumbnail?: string | null;
  title: string;
  year?: number | null;
  original_title?: string | null;
  director?: string | null;
  runtime?: number | null;
  certification?: string | null;
  sentimentColor: string;
}

export const MovieHeader: React.FC<MovieHeaderProps> = React.memo(({
  thumbnail,
  title,
  year,
  original_title,
  runtime,
  certification,
  sentimentColor,
}) => {
  const { colors } = useTheme();

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.md,
      alignItems: 'flex-start',
      backgroundColor: colors.background.primary,
    },
    poster: {
      width: 110,
      height: 165,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.secondary,
    },
    info: {
      flex: 1,
      paddingTop: spacing.xs,
    },
    title: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      lineHeight: typography.fontSize.h3 * 1.25,
      marginBottom: spacing.xs,
    },
    originalTitle: {
      fontSize: typography.fontSize.tiny,
      fontStyle: 'italic',
      color: colors.text.secondary,
      marginBottom: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    metaText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
    },
    metaDot: {
      fontSize: typography.fontSize.tiny,
      color: colors.text.secondary,
      opacity: 0.4,
    },
    certBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    certText: {
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary,
    },
    yearText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.semibold,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {thumbnail && (
        <Image source={{ uri: getCloudflareImageUrl(thumbnail) }} style={styles.poster} resizeMode="cover" />
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>

        {original_title && original_title !== title && (
          <Text style={styles.originalTitle}>"{original_title}"</Text>
        )}

        <View style={styles.metaRow}>
          {year && (
            <Text style={[styles.yearText, { color: sentimentColor }]}>{year}</Text>
          )}
          {runtime && runtime > 0 && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{formatRuntime(runtime)}</Text>
            </>
          )}
          {certification && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <View style={styles.certBadge}>
                <Text style={styles.certText}>{certification}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

MovieHeader.displayName = 'MovieHeader';
