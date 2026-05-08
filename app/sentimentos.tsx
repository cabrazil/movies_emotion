import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS, apiRequest } from './config';
import { Sentiment } from './types';
import { SentimentCarousel } from './components/premium/SentimentCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { DEFAULT_GRADIENT } from './components/premium/GradientBackground';

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
      setLoading(true);
      setError(null);
      const response = await apiRequest(API_ENDPOINTS.mainSentiments.summary);
      if (!response.ok) throw new Error(`Erro ao carregar sentimentos: ${response.status}`);
      const data = await response.json();
      setSentiments(data);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message.includes('Network request failed') || err.message.includes('Failed to fetch')
          ? 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
          : err.message
        : 'Erro desconhecido ao carregar sentimentos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSentimentSelect = (sentiment: Sentiment) => {
    router.push({
      pathname: '/intencoes/[id]',
      params: { id: sentiment.id.toString() }
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={DEFAULT_GRADIENT} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={DEFAULT_GRADIENT} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSentiments}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SentimentCarousel
      sentiments={sentiments}
      onSelect={handleSentimentSelect}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
