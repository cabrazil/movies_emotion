import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { translateOscarCategory } from './movieHelpers';

interface OscarAward {
  categoryName?: string;
  category?: string;
  personName?: string;
  year?: number;
}

interface OscarAwards {
  wins: OscarAward[];
  nominations: OscarAward[];
}

interface MovieAwardsProps {
  title: string;
  oscarAwards?: OscarAwards;
  awardsSummary?: string | null;
  sentimentColor: string;
}

export const MovieAwards: React.FC<MovieAwardsProps> = React.memo(({
  title,
  oscarAwards,
  awardsSummary,
  sentimentColor
}) => {
  const { colors } = useTheme();
  const [showFullNominations, setShowFullNominations] = useState(false);

  const hasOscarAwards = oscarAwards && 
    (oscarAwards.wins.length > 0 || oscarAwards.nominations.length > 0);

  const introText = useMemo(() => {
    if (!oscarAwards) return '';
    const totalAwards = oscarAwards.wins.length + oscarAwards.nominations.length;
    const year = oscarAwards.wins.length > 0 
      ? oscarAwards.wins[0].year 
      : oscarAwards.nominations[0]?.year;
    const hasWins = oscarAwards.wins.length > 0;
    
    return `${title} foi indicado a ${totalAwards} Oscar${totalAwards > 1 ? 's' : ''} em ${year}${hasWins ? ', conquistou' : ''}:`;
  }, [title, oscarAwards]);

  const styles = useMemo(() => StyleSheet.create({
    awardsSection: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.background.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    sectionTitle: {
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: spacing.md,
    },
    summaryText: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFD700',
      lineHeight: typography.fontSize.body * 1.5,
      marginBottom: spacing.xs,
    },
    nominationsText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
  }), [colors]);

  // Sem Oscar: verifica awardsSummary genérico
  if (!hasOscarAwards) {
    if (!awardsSummary) return null;
    return (
      <View style={styles.awardsSection}>
        <Text style={styles.sectionTitle}>Reconhecimento</Text>
        <Text style={styles.nominationsText}>{awardsSummary}</Text>
      </View>
    );
  }

  const wins = oscarAwards!.wins.length;
  const nominations = oscarAwards!.nominations.length;
  const year = wins > 0 ? oscarAwards!.wins[0].year : oscarAwards!.nominations[0]?.year;

  const summaryLine = wins > 0
    ? `Vencedor de ${wins} Oscar${wins > 1 ? 's' : ''}${nominations > 0 ? ` (e ${nominations} indicaç${nominations > 1 ? 'ões' : 'ão'})` : ''}`
    : `Indicado a ${nominations} Oscar${nominations > 1 ? 's' : ''}`;

  return (
    <View style={styles.awardsSection}>
      <Text style={styles.sectionTitle}>Reconhecimento</Text>
      <Text style={styles.summaryText}>🏆 {summaryLine}</Text>
      {year && <Text style={styles.nominationsText}>Cerimônia de {year}</Text>}
    </View>
  );
});

MovieAwards.displayName = 'MovieAwards';

