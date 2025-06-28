import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from './theme';
import { SentimentIcon } from './components/SentimentIcon';
import { API_ENDPOINTS } from './config';
import { Sentiment } from './types';

const CARD_MARGIN = 12;
const CARD_WIDTH = (Dimensions.get('window').width - (2 * spacing.md) - CARD_MARGIN) / 2;
const CARD_HEIGHT = 110;

export default function SentimentosScreen() {
  const router = useRouter();
  const [sentiments, setSentiments] = useState<Sentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentiments();
  }, []);

  const fetchSentiments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.mainSentiments.summary);
      if (!response.ok) {
        throw new Error('Erro ao carregar sentimentos');
      }
      const data = await response.json();
      setSentiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Carregando sentimentos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchSentiments}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sentiments.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nenhum sentimento encontrado</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchSentiments}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Como você está se sentindo hoje?</Text>
        <Text style={styles.subtitle}>Escolha o sentimento que melhor descreve seu estado emocional atual</Text>
      </View>
      <FlatList
        data={sentiments}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSentimentPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <SentimentIcon sentimentId={item.id} size={32} />
            </View>
            <Text style={styles.cardTitle}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.h2 * typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  flatListContent: {
    paddingBottom: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: CARD_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background.card,
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    width: '100%',
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
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.md,
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