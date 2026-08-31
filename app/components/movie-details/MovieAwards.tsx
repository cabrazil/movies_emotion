import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface OscarAward {
  categoryName?: string;
  category?: string;
  personName?: string;
  year?: number;
}

interface OscarAwards {
  wins?: OscarAward[];
  nominations?: OscarAward[];
  totalWins?: number;
  totalNominations?: number;
  summaryText?: string | null;
}

interface MovieAwardsProps {
  title: string;
  oscarAwards?: OscarAwards;
  awardsSummary?: string | null;
  sentimentColor?: string;
}

export const MovieAwards: React.FC<MovieAwardsProps> = React.memo(({
  title,
  oscarAwards,
  awardsSummary,
  sentimentColor
}) => {
  const { colors } = useTheme();

  // Determinar o texto principal a ser exibido (priorizando awardsSummary)
  const displayText = useMemo(() => {
    if (awardsSummary && awardsSummary.trim() !== '') {
      return awardsSummary;
    }
    if (oscarAwards?.summaryText && oscarAwards.summaryText.trim() !== '') {
      return oscarAwards.summaryText;
    }

    const wins = oscarAwards?.wins?.length || oscarAwards?.totalWins || 0;
    const nominations = oscarAwards?.nominations?.length || oscarAwards?.totalNominations || 0;

    if (wins > 0 && nominations > 0) {
      return `Vencedor de ${wins} Oscar${wins > 1 ? 's' : ''} (e ${nominations} indicaç${nominations > 1 ? 'ões' : 'ão'})`;
    }
    if (wins > 0) {
      return `Vencedor de ${wins} Oscar${wins > 1 ? 's' : ''}`;
    }
    if (nominations > 0) {
      return `Indicado a ${nominations} Oscar${nominations > 1 ? 's' : ''}`;
    }

    return null;
  }, [awardsSummary, oscarAwards]);

  const styles = useMemo(() => StyleSheet.create({
    awardsSection: {
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
      marginBottom: spacing.xs,
    },
    summaryText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFD700',
      lineHeight: typography.fontSize.body * 1.4,
    },
  }), [colors, sentimentColor]);

  if (!displayText) {
    return null;
  }

  return (
    <View style={styles.awardsSection}>
      <Text style={styles.sectionTitle}>Reconhecimento</Text>
      <Text style={styles.summaryText}>🏆 {displayText}</Text>
    </View>
  );
});

MovieAwards.displayName = 'MovieAwards';
