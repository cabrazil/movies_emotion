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

  // Ficha Premium: apenas os 4 primeiros
  const displayCast = mainCast.slice(0, 4);

  const styles = useMemo(() => StyleSheet.create({
    castSection: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: sentimentColor ? sentimentColor + '65' : colors.border.light,
    },
    sectionTitle: {
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
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
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.medium,
    },
    characterName: {
      fontSize: typography.fontSize.small,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: typography.fontWeight.regular,
    },
    asText: {
      fontStyle: 'italic',
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
      </View>
    </View>
  );
});

MovieCast.displayName = 'MovieCast';

