import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type SentimentIconProps = {
  name: string;
  size?: number;
};

export function SentimentIcon({ name, size = 24 }: SentimentIconProps) {
  const getIconName = () => {
    // Normaliza o nome do sentimento para comparação
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('feliz') || normalizedName.includes('alegre')) {
      return 'sentiment-very-satisfied';
    }
    
    if (normalizedName.includes('triste') || normalizedName.includes('melancólico')) {
      return 'sentiment-very-dissatisfied';
    }
    
    if (normalizedName.includes('calmo') || normalizedName.includes('relaxado')) {
      return 'sentiment-satisfied';
    }
    
    if (normalizedName.includes('ansioso') || normalizedName.includes('nervoso')) {
      return 'sentiment-dissatisfied';
    }
    
    if (normalizedName.includes('animado') || normalizedName.includes('entusiasmado')) {
      return 'sentiment-very-satisfied';
    }
    
    if (normalizedName.includes('cansado') || normalizedName.includes('desmotivado')) {
      return 'sentiment-dissatisfied';
    }
    
    if (normalizedName.includes('neutro') || normalizedName.includes('indiferente')) {
      return 'sentiment-neutral';
    }
    
    // Ícone padrão para qualquer outro sentimento
    return 'sentiment-neutral';
  };

  return (
    <View style={{ width: size, height: size }}>
      <MaterialIcons
        name={getIconName()}
        size={size}
        color={colors.primary.main}
      />
    </View>
  );
} 