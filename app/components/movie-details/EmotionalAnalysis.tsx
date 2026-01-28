import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface EmotionalAnalysisProps {
  title: string;
  contentWarnings?: string | null;
  landingPageHook?: string | null;
  targetAudienceForLP?: string | null;
  sentimentId?: string | string[];
  reason?: string | string[];
  sentimentColor: string;
  emotionalTags?: Array<{
    mainSentiment: string;
    subSentiment: string;
    relevance: number;
  }>;
}

export const EmotionalAnalysis: React.FC<EmotionalAnalysisProps> = React.memo(({
  title,
  contentWarnings,
  landingPageHook,
  targetAudienceForLP,
  sentimentId,
  reason,
  sentimentColor,
  emotionalTags
}) => {
  const { colors } = useTheme();

  const personalizedReason = useMemo(() => {
    if (!sentimentId || !reason) {
      return landingPageHook ?
        landingPageHook.replace(/<[^>]*>/g, '') :
        "Este filme oferece uma experiência cinematográfica única que vale a pena assistir.";
    }

    const sentimentNames: { [key: number]: string } = {
      13: "Feliz / Alegre",
      14: "Triste",
      15: "Calmo(a)",
      16: "Ansioso(a)",
      17: "Animado(a)",
      18: "Cansado(a)"
    };

    const sentimentName = sentimentNames[Number(sentimentId)] || "emocional";
    const reasonText = Array.isArray(reason) ? reason[0] : reason;
    const formattedReason = reasonText.charAt(0).toLowerCase() + reasonText.slice(1);

    return `Para quem está ${sentimentName} e quer Processar, este filme traz ${formattedReason}`;
  }, [sentimentId, reason, landingPageHook]);

  const showContentWarning = contentWarnings &&
    contentWarnings !== 'Atenção: nenhum alerta de conteúdo significativo.';

  const styles = useMemo(() => StyleSheet.create({
    emotionalAnalysisSection: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    contentAlert: {
      backgroundColor: colors.state.warning + '20',
      borderLeftWidth: 4,
      borderLeftColor: colors.state.warning,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    alertTitle: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.state.warning,
      marginLeft: spacing.xs,
    },
    alertText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    alertBold: {
      fontWeight: typography.fontWeight.bold,
    },
    vibeSection: {
      borderLeftWidth: 4,
      paddingLeft: spacing.md,
      marginBottom: spacing.md,
    },
    recommendationSection: {
      borderLeftWidth: 4,
      paddingLeft: spacing.md,
      marginBottom: spacing.md,
    },
    subsectionTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    vibeText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    recommendationText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    },
    emotionalTagsSection: {
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      marginBottom: spacing.md,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    emotionalTag: {
      backgroundColor: colors.primary.main + '20',
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    tagText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.medium,
    },
  }), [colors]);

  return (
    <>
      <View style={styles.emotionalAnalysisSection}>
        <Text style={styles.sectionTitle}>A Análise Emocional do Vibesfilm</Text>

        {/* Alerta de Conteúdo */}
        {showContentWarning ? (
          <View style={styles.contentAlert}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color={colors.state.warning} />
              <Text style={styles.alertTitle}>Alerta de Conteúdo</Text>
            </View>
            <Text style={styles.alertText}>
              <Text style={styles.alertBold}>Atenção: </Text>
              {contentWarnings.replace('Atenção: ', '')}
            </Text>
          </View>
        ) : (
          <View style={[styles.contentAlert, { backgroundColor: '#E8F5E9', borderLeftColor: '#4CAF50' }]}>
            <View style={styles.alertHeader}>
              <Ionicons name="checkmark-circle" size={20} color={'#4CAF50'} />
              <Text style={[styles.alertTitle, { color: '#4CAF50' }]}>Verificação de Conteúdo</Text>
            </View>
            <Text style={styles.alertText}>
              Nenhum alerta de conteúdo significativo identificado.
            </Text>
          </View>
        )}

        {/* A Vibe do Filme */}
        <View style={[styles.vibeSection, { borderColor: sentimentColor }]}>
          <Text style={styles.subsectionTitle}>A Vibe do Filme</Text>
          <Text style={styles.vibeText}>
            {landingPageHook ?
              landingPageHook.replace(/<[^>]*>/g, '') :
              `Prepare-se para uma experiência cinematográfica única com ${title}, um filme que oferece uma narrativa envolvente e personagens profundos.`
            }
          </Text>
        </View>

        {/* Para Quem Recomendamos */}
        <View style={[styles.recommendationSection, { borderColor: sentimentColor }]}>
          <Text style={styles.subsectionTitle}>Para Quem Recomendamos?</Text>
          <Text style={styles.recommendationText}>
            {targetAudienceForLP ?
              targetAudienceForLP :
              "Este filme pode ser perfeito para quem busca uma experiência cinematográfica única e envolvente."
            }
          </Text>
        </View>

        {/* Por que recomendamos para você */}
        <View style={[styles.recommendationSection, { borderColor: sentimentColor }]}>
          <Text style={styles.subsectionTitle}>Por que recomendamos para você?</Text>
          <Text style={styles.recommendationText}>
            {personalizedReason}
          </Text>
        </View>
      </View>

      {/* Tags Emocionais Chave */}
      {emotionalTags && emotionalTags.length > 0 && (
        <View style={styles.emotionalTagsSection}>
          <Text style={styles.subsectionTitle}>Este filme ressoa com quem busca:</Text>
          <View style={styles.tagsContainer}>
            {emotionalTags
              .sort((a, b) => b.relevance - a.relevance) // Ordenar por relevância (maior para menor)
              .slice(0, 4) // Pegar apenas as 4 mais relevantes
              .map((tag, index) => (
                <View key={index} style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
                  <Text style={[styles.tagText, { color: sentimentColor }]}>
                    {tag.subSentiment}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </>
  );
});

EmotionalAnalysis.displayName = 'EmotionalAnalysis';

