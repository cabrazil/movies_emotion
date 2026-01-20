import { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius, shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { API_ENDPOINTS, apiRequest } from '../config';
import { EmotionalIntentionsResponse, EmotionalIntention, Sentiment } from '../types';
import { IntentionIcon } from '../components/IntentionIcon';
import { AppHeader } from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

export default function IntencoesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
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
      const response = await apiRequest(API_ENDPOINTS.emotionalIntentions.list(id.toString()));
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

  const sentimentColor = useMemo(() =>
    sentiment ? (colors.sentimentColors[sentiment.id] || colors.primary.main) : colors.primary.main,
    [sentiment, colors]
  );

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.md, // Padding lateral consistente
    },
    scrollView: {
      flex: 1,
      paddingBottom: spacing.xl,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    // Header atualizado
    header: {
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'flex-start', // Alinhado à esquerda
    },
    title: {
      fontSize: typography.fontSize.h2,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
      textAlign: 'left',
      lineHeight: typography.fontSize.h2 * 1.2,
    },
    sentimentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sentimentLabel: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      marginRight: spacing.sm,
    },
    sentimentBadge: {
      borderRadius: borderRadius.full, // Badge arredondado
      paddingHorizontal: spacing.md,
      paddingVertical: 4, // Padding vertical menor
      borderWidth: 1,
    },
    sentimentBadgeText: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Lista de Intenções
    intentionsContainer: {
      paddingBottom: spacing.xl,
      gap: spacing.md, // Espaçamento entre cards
    },
    intentionCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.md,
      flexDirection: 'row', // Card horizontal
      alignItems: 'center', // Alinhamento vertical centralizado

      // Borda lateral sutil ou topo
      borderLeftWidth: 4,
    },
    intentionIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
      flexShrink: 0, // Não encolher
    },
    intentionContent: {
      flex: 1,
      justifyContent: 'center',
    },
    intentionTitle: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: 2, // Pequeno espaço
    },
    intentionDescription: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.small * 1.4,
    },
    arrowIcon: {
      marginLeft: spacing.xs,
    },
    // States
    loadingText: {
      marginTop: spacing.md,
      color: colors.primary.main,
      fontSize: typography.fontSize.body,
    },
    errorText: {
      color: colors.state.error,
      fontSize: typography.fontSize.body,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontWeight: typography.fontWeight.medium,
    },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Carregando opções...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchIntentions}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Qual a sua intenção?</Text>

            {sentiment && (
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentLabel}>Sentindo agora:</Text>
                <View style={[styles.sentimentBadge, {
                  backgroundColor: sentimentColor + '10', // Fundo bem suave
                  borderColor: sentimentColor + '40',
                }]}>
                  <Text style={[styles.sentimentBadgeText, { color: sentimentColor }]}>
                    {sentiment.name}
                  </Text>
                </View>
              </View>
            )}
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
                    borderLeftColor: sentimentColor,
                  }]}
                  onPress={() => handleIntentionPress(intention)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.intentionIconContainer, {
                    backgroundColor: sentimentColor + '15'
                  }]}>
                    <IntentionIcon
                      intentionType={intention.type}
                      size={26}
                      color={sentimentColor}
                    />
                  </View>

                  <View style={styles.intentionContent}>
                    <Text style={styles.intentionTitle}>
                      {getIntentionLabel(intention.type)}
                    </Text>
                    <Text style={styles.intentionDescription} numberOfLines={3}>
                      {intention.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text.light}
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} 