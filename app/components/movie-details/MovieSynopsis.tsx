import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface MovieSynopsisProps {
  description?: string | null;
  sentimentColor: string;
}

export const MovieSynopsis: React.FC<MovieSynopsisProps> = React.memo(({
  description,
  sentimentColor
}) => {
  const { colors } = useTheme();
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const maxLength = 200;

  const synopsis = description || 'Sinopse não disponível.';
  const shouldShowToggle = synopsis.length > maxLength;
  const displayText = useMemo(() => {
    if (synopsis.length <= maxLength || showFullSynopsis) {
      return synopsis;
    }
    return synopsis.substring(0, maxLength) + '...';
  }, [synopsis, showFullSynopsis, maxLength]);

  const styles = useMemo(() => StyleSheet.create({
    synopsisSection: {
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
    synopsisText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.body * typography.lineHeight.relaxed,
    },
    verMaisButton: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    verMaisText: {
      fontSize: typography.fontSize.small,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  }), [colors]);

  return (
    <View style={styles.synopsisSection}>
      <Text style={styles.sectionTitle}>Sinopse</Text>
      <Text style={styles.synopsisText}>{displayText}</Text>
      {shouldShowToggle && (
        <TouchableOpacity 
          style={styles.verMaisButton}
          onPress={() => setShowFullSynopsis(!showFullSynopsis)}
        >
          <Text style={[styles.verMaisText, { color: sentimentColor }]}>
            {showFullSynopsis ? 'Ver menos' : 'Ver mais'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

MovieSynopsis.displayName = 'MovieSynopsis';

