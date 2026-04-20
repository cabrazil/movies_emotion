import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface CuradoriaCardProps {
  sentimentId?: string | string[];
  intentionId?: string;
  optionText?: string | string[];
  reason?: string | string[];
  relevanceScore?: number | null;
  imdbRating?: number | null;
  vote_average?: number | null;
  sentimentColor: string;
}

const INTENTION_ID_TO_TYPE: { [key: number]: string } = {
  6: 'PROCESS', 7: 'TRANSFORM', 8: 'MAINTAIN', 9: 'EXPLORE',
  10: 'MAINTAIN', 11: 'EXPLORE', 12: 'PROCESS', 13: 'TRANSFORM',
  14: 'MAINTAIN', 15: 'EXPLORE', 16: 'PROCESS', 17: 'TRANSFORM',
  18: 'MAINTAIN', 19: 'EXPLORE', 20: 'TRANSFORM', 21: 'PROCESS',
  22: 'MAINTAIN', 23: 'EXPLORE', 24: 'PROCESS', 25: 'TRANSFORM',
  26: 'MAINTAIN', 27: 'EXPLORE',
};

const SENTIMENT_NAMES: { [key: number]: string } = {
  13: 'Feliz / Alegre',
  14: 'Triste',
  15: 'Calmo(a)',
  16: 'Ansioso(a)',
  17: 'Animado(a)',
  18: 'Cansado(a)',
};

const INTENTION_NAMES: { [key: string]: string } = {
  PROCESS: 'Processar',
  MAINTAIN: 'Manter',
  TRANSFORM: 'Transformar',
  REPLACE: 'Substituir',
  EXPLORE: 'Explorar',
};

const capitalize = (str?: string): string | undefined =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : undefined;

export const CuradoriaCard: React.FC<CuradoriaCardProps> = React.memo(({
  sentimentId,
  intentionId,
  optionText,
  reason,
  relevanceScore,
  imdbRating,
  vote_average,
  sentimentColor,
}) => {
  const { colors } = useTheme();

  const rawScore = imdbRating ?? (vote_average != null ? vote_average * 10 : null);
  
  // Priorizar o relevanceScore (igual na web). Se não houver, cai pro fallback (imdb/tmdb)
  const score = relevanceScore != null && isFinite(Number(relevanceScore)) 
    ? Number(relevanceScore) 
    : (rawScore != null && isFinite(Number(rawScore)) ? Number(rawScore) : null);
        
  // UX logic para as cores da badge
  let scoreColor = '#EF4444'; // Red default para menor que 6.0
  if (score !== null) {
    if (score >= 8.5) {
      scoreColor = '#2563EB'; // Azul Premium / Masterpiece
    } else if (score >= 7.5) {
      scoreColor = '#10B981'; // Verde Padrão / Excelente 
    } else if (score >= 6.0) {
      scoreColor = '#D97706'; // Laranja / Bom 
    }
  }

  const sentimentName = sentimentId ? SENTIMENT_NAMES[Number(sentimentId)] : null;
  const intentionType = intentionId ? INTENTION_ID_TO_TYPE[Number(intentionId)] : null;
  const intentionName = intentionType ? INTENTION_NAMES[intentionType] : null;

  // Texto da opção da jornada (ex: "...provoque um calor no coração")
  const rawOptionText = Array.isArray(optionText) ? optionText[0] : optionText;
  const optionLabel = capitalize(rawOptionText);

  // Razão personalizada com primeira letra maiúscula
  const rawReason = Array.isArray(reason) ? reason[0] : reason;
  const reasonText = capitalize(rawReason);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primary.main + '30',
    },
    topBar: {
      height: 3,
      backgroundColor: scoreColor,
    },
    inner: {
      padding: spacing.md,
      backgroundColor: colors.background.card,
    },
    header: {
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary.light,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: spacing.md,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    scoreBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: scoreColor,
    },
    scoreText: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.bold,
      color: '#fff',
      lineHeight: typography.fontSize.h4,
    },
    context: {
      flex: 1,
    },
    contextLabel: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
    },
    contextHighlight: {
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
    },
    // Texto da opção da jornada em itálico azul (igual à página premium web)
    optionText: {
      fontSize: typography.fontSize.small,
      color: colors.primary.light,
      fontStyle: 'italic',
      lineHeight: typography.fontSize.small * 1.5,
      marginTop: 6,
      fontWeight: typography.fontWeight.medium,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    reasonText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.small * 1.6,
    },
  }), [colors, scoreColor]);

  if (!sentimentName && !reasonText) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar} />
      <View style={styles.inner}>
        <Text style={styles.header}>Curadoria VibesFilm: Por que recomendamos?</Text>

        <View style={styles.scoreRow}>
          {score !== null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{score.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.context}>
            {sentimentName && intentionName && (
              <Text style={styles.contextLabel}>
                Para quem está{' '}
                <Text style={styles.contextHighlight}>{sentimentName}</Text>
                {' '}e quer{' '}
                <Text style={styles.contextHighlight}>{intentionName}</Text>:
              </Text>
            )}
            {/* Texto da opção da jornada — igual ao web premium */}
            {optionLabel && (
              <Text style={styles.optionText}>"{optionLabel}"</Text>
            )}
          </View>
        </View>

        {reasonText && (
          <>
            <View style={styles.divider} />
            <Text style={styles.reasonText}>{reasonText}</Text>
          </>
        )}
      </View>
    </View>
  );
});

CuradoriaCard.displayName = 'CuradoriaCard';
