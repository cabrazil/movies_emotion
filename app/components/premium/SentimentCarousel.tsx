import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SentimentIcon } from '../SentimentIcon';
import { GlassCard } from './GlassCard';
import { PaginationDots } from './PaginationDots';
import { SENTIMENT_GRADIENTS, DEFAULT_GRADIENT } from './GradientBackground';
import { Sentiment } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Cores de acento por sentimento
const SENTIMENT_ACCENT: Record<number, string> = {
  13: '#dca353',
  14: '#5e97d1',
  15: '#5bb37d',
  16: '#ae7bc9',
  17: '#e06b6b',
  18: '#8888aa',
};

// Exibe nome do sentimento padronizado com sufixo (a) para consistência visual
const getDisplayName = (name: string): string => {
  const map: Record<string, string> = {
    // Nomes que precisam de ajuste de exibição (muito longos ou grafia alternativa)
    'Introspectivo(a)': 'Introspectivo(a)',
    'Animado(a)': 'Animado(a)',
    'Cansado(a)': 'Cansado(a)',
    'Calmo(a)': 'Calmo(a)',
    'Ansioso(a)': 'Ansioso(a)',
    // Feliz e Triste são neutros, sem necessidade de sufixo
    'Feliz': 'Feliz',
    'Triste': 'Triste',
  };
  return map[name] || name;
};

interface SentimentSlideProps {
  sentiment: Sentiment;
  onPress: (sentiment: Sentiment) => void;
}

const SentimentSlide: React.FC<SentimentSlideProps> = ({ sentiment, onPress }) => {
  const gradient = SENTIMENT_GRADIENTS[sentiment.id] || DEFAULT_GRADIENT;
  const accent = SENTIMENT_ACCENT[sentiment.id] || '#FFFFFF';

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(sentiment);
  }, [sentiment, onPress]);

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.4, 1]}
      style={styles.slide}
    >
      {/* Ícone do sentimento */}
      <View style={styles.iconWrapper}>
        <View style={[styles.iconContainer, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
          <SentimentIcon sentimentId={sentiment.id} size={52} color={accent} />
        </View>
      </View>

      {/* Nome e descrição */}
      <View style={styles.textContainer}>
        <Text style={[styles.sentimentName, { color: '#FFFFFF' }]} adjustsFontSizeToFit numberOfLines={1}>
          {getDisplayName(sentiment.name)}
        </Text>
        <Text style={styles.sentimentDescription} numberOfLines={3}>
          {sentiment.shortDescription || sentiment.description || ''}
        </Text>
      </View>

      {/* Botão de ação glassmorphism */}
      <View style={styles.buttonWrapper}>
        <GlassCard
          style={styles.button}
          intensity={25}
          borderColor={accent + '65'}
          borderRadius={50}
          borderWidth={1.5}
        >
          <TouchableOpacity
            style={styles.buttonTouchable}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: accent }]}>
              Estou assim agora
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </LinearGradient>
  );
};

interface SentimentCarouselProps {
  sentiments: Sentiment[];
  onSelect: (sentiment: Sentiment) => void;
}

export const SentimentCarousel: React.FC<SentimentCarouselProps> = ({
  sentiments,
  onSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        Haptics.selectionAsync();
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  });

  const currentAccent =
    sentiments[currentIndex]
      ? SENTIMENT_ACCENT[sentiments[currentIndex].id] || '#FFFFFF'
      : '#FFFFFF';

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={sentiments}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        renderItem={({ item }) => (
          <SentimentSlide sentiment={item} onPress={onSelect} />
        )}
      />

      {/* Indicador de swipe destacado */}
      <View style={styles.swipeIndicator}>
        <Text style={styles.swipeArrow}>←</Text>
        <PaginationDots
          total={sentiments.length}
          current={currentIndex}
          activeColor={currentAccent}
          inactiveColor="rgba(255,255,255,0.25)"
        />
        <Text style={styles.swipeArrow}>→</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  sentimentName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sentimentDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    overflow: 'hidden',
  },
  buttonTouchable: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  swipeArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
    fontWeight: '300',
  },
});
