import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface Actor {
  actorName: string;
  characterName?: string;
  order?: number;
}

interface MovieCastProps {
  mainCast?: Actor[];
  sentimentColor: string;
}

export const MovieCast: React.FC<MovieCastProps> = React.memo(({
  mainCast,
  sentimentColor
}) => {
  const { colors } = useTheme();
  const [showFullCast, setShowFullCast] = useState(false);
  const initialCount = 5;

  if (!mainCast || mainCast.length === 0) {
    return null;
  }

  const displayCast = showFullCast ? mainCast : mainCast.slice(0, initialCount);
  const hasMore = mainCast.length > initialCount;

  const styles = useMemo(() => StyleSheet.create({
    castSection: {
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
    castContainer: {
      gap: spacing.sm,
    },
    castItem: {
      marginBottom: spacing.xs,
    },
    actorName: {
      fontSize: typography.fontSize.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.medium,
    },
    characterName: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.regular,
    },
    asText: {
      fontStyle: 'italic',
    },
    castToggleContainer: {
      marginTop: spacing.sm,
      alignItems: 'flex-start',
    },
    castToggleText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.semibold,
      textDecorationLine: 'underline',
    },
  }), [colors]);

  return (
    <View style={styles.castSection}>
      <Text style={styles.sectionTitle}>Elenco Principal</Text>
      
      <View style={styles.castContainer}>
        {displayCast.map((actor, index) => (
          <View key={index} style={styles.castItem}>
            <Text style={styles.actorName}>
              {actor.actorName}
              {actor.characterName && (
                <Text style={styles.characterName}>
                  <Text style={styles.asText}> como </Text>
                  {actor.characterName}
                </Text>
              )}
            </Text>
          </View>
        ))}
        
        {hasMore && (
          <View style={styles.castToggleContainer}>
            <TouchableOpacity onPress={() => setShowFullCast(!showFullCast)}>
              <Text style={[styles.castToggleText, { color: sentimentColor }]}>
                {showFullCast 
                  ? 'Ver menos...' 
                  : `Ver mais... (${mainCast.length - initialCount} atores)`
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

MovieCast.displayName = 'MovieCast';

