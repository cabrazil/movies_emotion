import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { API_ENDPOINTS } from '../config';
import { EmotionalIntentionsResponse, EmotionalIntention, Sentiment } from '../types';
import { IntentionIcon } from '../components/IntentionIcon';
import { AppHeader } from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

export default function IntencoesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentions, setIntentions] = useState<EmotionalIntention[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  
  // Animação do indicador de scroll
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

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
      
      // Mostrar indicador se houver mais de 3 intenções
      setShowScrollIndicator(data.intentions.length > 3);
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

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Esconder indicador após 50px de scroll
    if (scrollY > 50 && showScrollIndicator) {
      Animated.timing(scrollIndicatorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScrollIndicator(false));
    }
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
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
        <AppHeader showBack={true} showLogo={true} />
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
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
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
        </ScrollView>

        {/* Indicador de scroll animado */}
        {showScrollIndicator && (
          <Animated.View 
            style={[
              styles.scrollIndicator,
              { opacity: scrollIndicatorOpacity }
            ]}
          >
            <Ionicons name="chevron-down" size={24} color={sentimentColor} />
          </Animated.View>
        )}
      </View>
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
  scrollView: {
    flex: 1,
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
  scrollIndicator: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
}); 