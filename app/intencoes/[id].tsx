import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { API_ENDPOINTS } from '../config';
import { EmotionalIntentionsResponse, EmotionalIntention, Sentiment } from '../types';
import { IntentionIcon } from '../components/IntentionIcon';
import { NavigationFooter } from '../components/NavigationFooter';

export default function IntencoesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentions, setIntentions] = useState<EmotionalIntention[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  useEffect(() => {
    fetchIntentions();
  }, []);

  const fetchIntentions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.emotionalIntentions.list(id.toString()));
      if (!response.ok) {
        throw new Error('Erro ao carregar intenções emocionais');
      }
      const data: EmotionalIntentionsResponse = await response.json();
      setIntentions(data.intentions);
      setSentiment({
        id: data.sentimentId,
        name: data.sentimentName,
        description: '',
        keywords: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleIntentionPress = (intention: EmotionalIntention) => {
    router.push({
      pathname: '/jornada-personalizada/[sentimentId]/[intentionId]',
      params: { 
        sentimentId: id.toString(),
        intentionId: intention.id.toString()
      }
    });
  };

  const handleSkipIntention = () => {
    // Usar jornada tradicional
    router.push({
      pathname: '/jornada/[id]',
      params: { id: id.toString() }
    });
  };

  const getIntentionLabel = (type: string): string => {
    const labels = {
      'PROCESS': 'Processar',
      'TRANSFORM': 'Transformar',
      'MAINTAIN': 'Manter',
      'EXPLORE': 'Explorar'
    };
    return labels[type as keyof typeof labels] || type;
  };



  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Carregando intenções emocionais...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchIntentions}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>O que você gostaria de fazer com esse sentimento?</Text>
        {sentiment && (
          <View style={styles.sentimentBadge}>
            <Text style={styles.sentimentBadgeText}>{sentiment.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.intentionsContainer}>
        {intentions
          .sort((a, b) => {
            // Definir ordem específica para as intenções
            const order = ['PROCESS', 'TRANSFORM', 'MAINTAIN', 'EXPLORE'];
            const indexA = order.indexOf(a.type);
            const indexB = order.indexOf(b.type);
            return indexA - indexB;
          })
          .map((intention) => (
            <TouchableOpacity
              key={intention.id}
              style={styles.intentionCard}
              onPress={() => handleIntentionPress(intention)}
              activeOpacity={0.8}
            >
              <View style={styles.intentionHeader}>
                <View style={styles.intentionIconContainer}>
                  <IntentionIcon 
                    intentionType={intention.type} 
                    size={28} 
                    color={colors.white} 
                  />
                </View>
                <Text style={styles.intentionTitle}>
                  {getIntentionLabel(intention.type)}
                </Text>
              </View>
              
              <Text style={styles.intentionDescription}>
                {intention.description}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      <NavigationFooter backLabel="Voltar aos Sentimentos" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  sentimentBadge: {
    backgroundColor: colors.primary.main + '15',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sentimentBadgeText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.main,
    textAlign: 'center',
  },

  intentionsContainer: {
    flex: 1,
    padding: spacing.md,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  intentionCard: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  intentionIconContainer: {
    marginRight: spacing.sm,
  },
  intentionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    flex: 1,
  },
  intentionDescription: {
    fontSize: typography.fontSize.body,
    color: colors.white,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  footer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },

  loadingText: {
    marginTop: spacing.md,
    color: colors.primary.main,
    fontSize: typography.fontSize.body,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  errorText: {
    color: colors.state.error,
    fontSize: typography.fontSize.body,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
}); 