import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface MovieSynopsisProps {
  description?: string | null;
  director?: string | null;
  sentimentColor: string;
}

export const MovieSynopsis: React.FC<MovieSynopsisProps> = React.memo(({
  description,
  director,
  sentimentColor,
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 220;

  const text = description || 'Sinopse não disponível.';
  const needsToggle = text.length > MAX_LENGTH;
  const displayText = useMemo(() => {
    if (!needsToggle || expanded) return text;
    return text.substring(0, MAX_LENGTH) + '…';
  }, [text, expanded, needsToggle]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    sectionTitle: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    synopsisText: {
      fontSize: typography.fontSize.small,
      color: colors.text.primary,
      lineHeight: typography.fontSize.small * 1.65,
      fontWeight: typography.fontWeight.regular,
    },
    toggleButton: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    toggleText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.semibold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    directorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    directorLabel: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
    },
    directorName: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sinopse</Text>
      <Text style={styles.synopsisText}>{displayText}</Text>

      {needsToggle && (
        <TouchableOpacity style={styles.toggleButton} onPress={() => setExpanded(!expanded)}>
          <Text style={[styles.toggleText, { color: sentimentColor }]}>
            {expanded ? 'Ler menos ↑' : 'Ler mais…'}
          </Text>
        </TouchableOpacity>
      )}

      {director && (
        <>
          <View style={styles.divider} />
          <View style={styles.directorRow}>
            <Text style={styles.directorLabel}>Direção:</Text>
            <Text style={styles.directorName}>{director}</Text>
          </View>
        </>
      )}
    </View>
  );
});

MovieSynopsis.displayName = 'MovieSynopsis';
