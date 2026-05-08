import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { SENTIMENT_GRADIENTS, DEFAULT_GRADIENT } from './GradientBackground';
import { EmotionalIntention } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ícones e labels por tipo de intenção
const INTENTION_CONFIG: Record<string, { icon: string; label: string; description: string }> = {
  MAINTAIN: {
    icon: 'shield-checkmark-outline',
    label: 'Manter',
    description: 'Permanecer neste estado com suavidade',
  },
  PROCESS: {
    icon: 'water-outline',
    label: 'Processar',
    description: 'Sentir com profundidade e clareza',
  },
  TRANSFORM: {
    icon: 'flash-outline',
    label: 'Transformar',
    description: 'Mudar o estado emocional agora',
  },
  EXPLORE: {
    icon: 'compass-outline',
    label: 'Explorar',
    description: 'Descobrir novas perspectivas',
  },
};

// Ordem de exibição das intenções
const INTENTION_ORDER = ['MAINTAIN', 'PROCESS', 'TRANSFORM', 'EXPLORE'];

// Cores de acento por sentimento (mesmas do carrossel)
const SENTIMENT_ACCENT: Record<number, string> = {
  13: '#e8820a',
  14: '#4A9EE8',
  15: '#4CAF7D',
  16: '#C96BE0',
  17: '#FF6B6B',
  18: '#8888aa',
};

interface IntentionCardsProps {
  intentions: EmotionalIntention[];
  sentimentId: number;
  sentimentName: string;
  onSelect: (intention: EmotionalIntention) => void;
  onBack: () => void;
}

export const IntentionCards: React.FC<IntentionCardsProps> = ({
  intentions,
  sentimentId,
  sentimentName,
  onSelect,
  onBack,
}) => {
  const gradient = SENTIMENT_GRADIENTS[sentimentId] || DEFAULT_GRADIENT;
  const accent = SENTIMENT_ACCENT[sentimentId] || '#FFFFFF';

  // Animação de entrada: cada card sobe com stagger
  const cardAnims = useRef(
    intentions.map(() => new Animated.Value(60))
  ).current;
  const cardOpacities = useRef(
    intentions.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = cardAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacities[i], {
          toValue: 1,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(80, animations).start();
  }, []);

  const sortedIntentions = [...intentions].sort((a, b) => {
    const indexA = INTENTION_ORDER.indexOf(a.type);
    const indexB = INTENTION_ORDER.indexOf(b.type);
    return indexA - indexB;
  });

  const handleSelect = useCallback(async (intention: EmotionalIntention) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(intention);
  }, [onSelect]);

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.4, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.sentimentLabel}>
            Você está{' '}
            <Text style={[styles.sentimentName, { color: accent }]}>
              {sentimentName}
            </Text>
          </Text>
          <Text style={styles.title}>O que você busca{'\n'}agora?</Text>
        </View>

        {/* Cards de intenção */}
        <View style={styles.cardsContainer}>
          {sortedIntentions.map((intention, index) => {
            const config = INTENTION_CONFIG[intention.type];
            if (!config) return null;

            return (
              <Animated.View
                key={intention.id}
                style={{
                  transform: [{ translateY: cardAnims[index] }],
                  opacity: cardOpacities[index],
                }}
              >
                <GlassCard
                  style={styles.card}
                  intensity={18}
                  borderColor={accent + '65'}
                  borderRadius={20}
                  borderWidth={1.5}
                >
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={() => handleSelect(intention)}
                    activeOpacity={0.75}
                  >
                    {/* Ícone */}
                    <View style={[styles.iconContainer, { backgroundColor: accent + '20' }]}>
                      <Ionicons
                        name={config.icon as any}
                        size={22}
                        color={accent}
                      />
                    </View>

                    {/* Textos */}
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{config.label}</Text>
                      <Text style={styles.cardDescription} numberOfLines={3}>
                        {intention.description || config.description}
                      </Text>
                    </View>

                    {/* Seta */}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={accent + '80'}
                    />
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sentimentLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    fontWeight: '400',
  },
  sentimentName: {
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -1,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 14,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  card: {
    width: '100%',
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 19,
    fontWeight: '500',
  },
});
