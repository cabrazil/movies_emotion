import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ENDPOINTS, apiRequest } from '../config';
import { EmotionalIntentionsResponse, EmotionalIntention, Sentiment } from '../types';
import { IntentionCards } from '../components/premium/IntentionCards';
import { LinearGradient } from 'expo-linear-gradient';
import { SENTIMENT_GRADIENTS, DEFAULT_GRADIENT } from '../components/premium/GradientBackground';

export default function IntencoesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentions, setIntentions] = useState<EmotionalIntention[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  const gradient = SENTIMENT_GRADIENTS[Number(id)] || DEFAULT_GRADIENT;

  useEffect(() => {
    fetchIntentions();
  }, [id]);

  const fetchIntentions = async () => {
    try {
      setLoading(true);
      setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleIntentionSelect = (intention: EmotionalIntention) => {
    router.push({
      pathname: '/jornada-personalizada/[sentimentId]/[intentionId]',
      params: {
        sentimentId: id.toString(),
        intentionId: intention.id.toString()
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Buscando intenções...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !sentiment) {
    return (
      <LinearGradient colors={gradient} locations={[0, 0.4, 1]} style={{ flex: 1 }}>
        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
          <Text style={styles.errorText}>{error || 'Erro desconhecido'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchIntentions}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <IntentionCards
      intentions={intentions}
      sentimentId={sentiment.id}
      sentimentName={sentiment.name}
      onSelect={handleIntentionSelect}
      onBack={handleBack}
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