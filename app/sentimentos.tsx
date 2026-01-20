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

  // Estilos otimizados para Grid
  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    // Removendo padding do container principal para o Header encostar nas bordas se quisesse, 
    // mas mantendo consistência com a Home
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.md,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    // Header alinhado à esquerda como na Home
    header: {
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
      alignItems: 'flex-start',
    },
    title: {
      fontSize: typography.fontSize.h2, // H2 para não brigar com o BackButton
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    subtitle: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.regular,
      color: colors.text.secondary,
      textAlign: 'left',
    },
    // Grid Content
    flatListContent: {
      paddingBottom: spacing.xl,
    },
    columnWrapper: {
      justifyContent: 'space-between', // Espaça os cards horizontalmente
    },
    // Novo Card Estilo Grid
    card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.md,

      // Dimensões para Grid (quase quadrado)
      width: '48%', // Deixa um espacinho no meio (aproximadamente 4% de gap)
      aspectRatio: 1, // Quadrado

      justifyContent: 'space-between',
      alignItems: 'flex-start', // Alinhamento interno à esquerda

      // Borda visual colorida (agora no topo ou lateral fina)
      borderTopWidth: 4,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginTop: 'auto', // Empurra para baixo se sobrar espaço
    },
    // Loading/Error states mantidos iguais
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchSentiments}>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchSentiments}>
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
          <Text style={styles.title}>Como você está?</Text>
          <Text style={styles.subtitle}>Escolha o que melhor descreve seu momento.</Text>
        </View>

        <FlatList
          data={sentiments}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.flatListContent}

          // Configuração de Grid
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}

          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const sentimentColor = colors.sentimentColors[item.id] || colors.primary.main;
            // Descrição removida do card reduzido para limpeza visual

            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  { borderTopColor: sentimentColor } // Borda colorida no topo
                ]}
                onPress={() => handleSentimentPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: sentimentColor + '15' }]}>
                  <SentimentIcon sentimentId={item.id} size={28} color={sentimentColor} />
                </View>

                <Text style={styles.cardTitle}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
