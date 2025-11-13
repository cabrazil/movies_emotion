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
    oscarAwardsContainer: {
      gap: spacing.sm,
    },
    awardsIntroText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    awardsList: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    nominationsList: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    awardItem: {
      marginBottom: spacing.xs,
    },
    awardText: {
      fontSize: typography.fontSize.body,
      color: colors.text.primary,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    awardForText: {
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
    awardPersonText: {
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
    },
    awardsToggleContainer: {
      marginTop: spacing.sm,
      alignItems: 'flex-start',
    },
    awardsToggleText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.semibold,
      textDecorationLine: 'underline',
    },
    generalAwardsContainer: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: spacing.sm,
    },
    generalAwardsText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
      textAlign: 'center',
    },
  }), [colors]);

  if (hasOscarAwards) {
    return (
      <View style={styles.awardsSection}>
        <Text style={styles.sectionTitle}>Premiações e Reconhecimento</Text>
        
        <View style={styles.oscarAwardsContainer}>
          <Text style={styles.awardsIntroText}>{introText}</Text>

          {/* Vitórias no Oscar - sempre visíveis */}
          {oscarAwards.wins && oscarAwards.wins.length > 0 && (
            <View style={styles.awardsList}>
              {oscarAwards.wins.map((win, index) => (
                <View key={index} style={styles.awardItem}>
                  <Text style={styles.awardText}>
                    {translateOscarCategory(win.categoryName || win.category || '')}{' '}
                    <Text style={styles.awardForText}>para</Text>{' '}
                    <Text style={styles.awardPersonText}>{win.personName}</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Indicações que não venceram - só aparecem no "Ver mais" */}
          {oscarAwards.nominations && oscarAwards.nominations.length > 0 && (
            <>
              {showFullNominations && (
                <View style={styles.nominationsList}>
                  {oscarAwards.nominations.map((nomination, index) => (
                    <View key={index} style={styles.awardItem}>
                      <Text style={styles.awardText}>
                        {translateOscarCategory(nomination.categoryName || nomination.category || '')}{' '}
                        <Text style={styles.awardForText}>para</Text>{' '}
                        <Text style={styles.awardPersonText}>{nomination.personName}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.awardsToggleContainer}>
                <TouchableOpacity onPress={() => setShowFullNominations(!showFullNominations)}>
                  <Text style={[styles.awardsToggleText, { color: sentimentColor }]}>
                    {showFullNominations 
                      ? 'Ver menos...' 
                      : `Ver mais... (${oscarAwards.nominations.length} ${oscarAwards.nominations.length > 1 ? 'indicações' : 'indicação'})`
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  // Layout para premiações gerais
  return (
    <View style={styles.awardsSection}>
      <Text style={styles.sectionTitle}>Premiações e Reconhecimento</Text>
      <View style={styles.generalAwardsContainer}>
        <Text style={styles.generalAwardsText}>
          {awardsSummary && awardsSummary.trim() !== '' && !awardsSummary.toLowerCase().includes('oscar')
            ? `Este filme recebeu "${awardsSummary}" em outras cerimônias de premiações.`
            : 'Este filme pode ter recebido outros reconhecimentos importantes em festivais e premiações especializadas.'
          }
        </Text>
      </View>
    </View>
  );
});

MovieAwards.displayName = 'MovieAwards';

