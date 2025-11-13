import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius, shadows } from './theme';
import { useTheme } from './hooks/useTheme';
import { SentimentIcon } from './components/SentimentIcon';
import { AppHeader } from './components/AppHeader';
import { API_ENDPOINTS, apiRequest } from './config';
import { Sentiment } from './types';
import { Ionicons } from '@expo/vector-icons';

// Mapeamento de descrições auxiliares por sentimento
const sentimentDescriptions: Record<number, string> = {
  13: 'Que filme te ajuda a amplificar, canalizar ou saborear essa boa energia?',
  14: 'O cinema te guia para processar, explorar ou transformar essa emoção.',
  15: 'Que filme te ajuda a aprofundar, manter, explorar ou agitar essa serenidade?',
  16: 'Um filme pode te ajudar a processar, transformar ou focar essa inquietação.',
  17: 'Um filme pode amplificar, direcionar ou surpreender essa vibração.',
  18: 'Que filme pode te ajudar a recarregar, descontrair ou explorar essa sensação?',
};

export default function SentimentosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [sentiments, setSentiments] = useState<Sentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
  // Animação para o indicador de scroll
  const scrollIndicatorAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchSentiments();
  }, []);

  useEffect(() => {
    // Animação bounce para o indicador de scroll
    if (showScrollIndicator) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollIndicatorAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scrollIndicatorAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showScrollIndicator]);

  const fetchSentiments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(API_ENDPOINTS.mainSentiments.summary);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`Erro ao carregar sentimentos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (__DEV__) {
        console.log('📦 Dados recebidos:', data.length, 'sentimentos');
      }
      
      setSentiments(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message.includes('timeout') 
          ? 'Tempo de conexão esgotado. Verifique sua conexão com a internet.'
          : err.message.includes('CORS') || err.message.includes('cors')
          ? 'Erro de conexão com o servidor. Aguarde alguns instantes e tente novamente.'
          : err.message.includes('Network request failed') || err.message.includes('Failed to fetch')
          ? 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
          : err.message
        : 'Erro desconhecido ao carregar sentimentos';
      
      if (__DEV__) {
        console.error('❌ Erro ao buscar sentimentos:', err);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSentimentPress = (sentiment: Sentiment) => {
    router.push({
      pathname: '/intencoes/[id]',
      params: { id: sentiment.id.toString() }
    });
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    // Esconde o indicador após rolar 50px
    if (scrollY > 50 && showScrollIndicator) {
      setShowScrollIndicator(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      padding: spacing.md,
      paddingTop: spacing.md,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    header: {
      marginBottom: spacing.xl,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    title: {
      fontSize: 24,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
      textAlign: 'center',
      lineHeight: 24 * typography.lineHeight.tight,
    },
    subtitle: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.regular,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: typography.fontSize.body * typography.lineHeight.relaxed,
    },
    flatListContent: {
      paddingBottom: spacing.xl * 2,
    },
    card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.md,
      minHeight: 120,
    },
    cardContent: {
      flex: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    titleContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    cardDescription: {
      fontSize: typography.fontSize.small,
      fontWeight: typography.fontWeight.regular,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.small * typography.lineHeight.relaxed,
    },
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
      paddingHorizontal: spacing.md,
    },
    emptyText: {
      color: colors.text.secondary,
      fontSize: typography.fontSize.body,
      marginBottom: spacing.md,
    },
    retryButton: {
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
    },
    scrollIndicator: {
      position: 'absolute',
      bottom: spacing.xl,
      alignSelf: 'center',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.full,
      padding: spacing.xs,
      ...shadows.lg,
      elevation: 8,
    },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Carregando sentimentos...</Text>
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
            onPress={fetchSentiments}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (sentiments.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum sentimento encontrado</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSentiments}
          >
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
        <View style={styles.header}>
          <Text style={styles.title}>Como você está se sentindo?</Text>
          <Text style={styles.subtitle}>Escolha o sentimento que melhor descreve seu estado emocional atual.</Text>
        </View>
        <FlatList
        data={sentiments}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.flatListContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sentimentColor = colors.sentimentColors[item.id] || colors.primary.main;
          const description = sentimentDescriptions[item.id] || '';
          
          return (
            <TouchableOpacity
              style={[
                styles.card,
                { 
                  borderLeftWidth: 4,
                  borderLeftColor: sentimentColor,
                }
              ]}
              onPress={() => handleSentimentPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: sentimentColor + '15' }]}>
                    <SentimentIcon sentimentId={item.id} size={32} color={sentimentColor} />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {description && (
                      <Text style={styles.cardDescription}>{description}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      
      {/* Indicador de scroll animado */}
      {showScrollIndicator && sentiments.length > 4 && (
        <Animated.View 
          style={[
            styles.scrollIndicator,
            {
              opacity: scrollIndicatorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  translateY: scrollIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="chevron-down" size={32} color={colors.primary.main} />
        </Animated.View>
      )}
      </View>
    </SafeAreaView>
  );
}
