import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { API_ENDPOINTS } from '../config';
import { EmotionalIntentionsResponse, EmotionalIntention, Sentiment } from '../types';
import { IntentionIcon } from '../components/IntentionIcon';
import { NavigationFooter } from '../components/NavigationFooter';
import { AppHeader } from '../components/AppHeader';

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
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Carregando intenções emocionais...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchIntentions}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sentimentColor = sentiment ? (colors.sentimentColors[sentiment.id] || colors.primary.main) : colors.primary.main;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>O que você gostaria de fazer com esse sentimento?</Text>
          {sentiment && (
            <View style={[styles.sentimentBadge, { 
              backgroundColor: sentimentColor + '15',
              borderColor: sentimentColor + '30',
            }]}>
              <Text style={[styles.sentimentBadgeText, { color: sentimentColor }]}>
                {sentiment.name}
              </Text>
            </View>
          )}
          <Text style={styles.subtitle}>Escolha sua intenção emocional:</Text>
        </View>

      <View style={styles.intentionsContainer}>
        {intentions
          .sort((a, b) => {
            const order = ['PROCESS', 'TRANSFORM', 'MAINTAIN', 'EXPLORE'];
            const indexA = order.indexOf(a.type);
            const indexB = order.indexOf(b.type);
            return indexA - indexB;
          })
          .map((intention) => (
            <TouchableOpacity
              key={intention.id}
              style={[styles.intentionCard, {
                borderLeftWidth: 4,
                borderLeftColor: sentimentColor,
              }]}
              onPress={() => handleIntentionPress(intention)}
              activeOpacity={0.7}
            >
              <View style={styles.intentionHeader}>
                <View style={[styles.intentionIconContainer, { 
                  backgroundColor: sentimentColor + '20' 
                }]}>
                  <IntentionIcon 
                    intentionType={intention.type} 
                    size={24} 
                    color={sentimentColor} 
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  sentimentBadge: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sentimentBadgeText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  intentionsContainer: {
    flex: 1,
    padding: spacing.md,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  intentionCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  intentionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  intentionTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  intentionDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.small * typography.lineHeight.relaxed,
    marginLeft: 48 + spacing.md,
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