import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from "../theme";

type IconType = 'Ionicons' | 'MaterialCommunityIcons';
type IconName = keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;

interface SentimentIconProps {
  sentimentId: number;
  size?: number;
}

interface IconConfig {
  name: IconName;
  color: string;
  type: IconType;
}

export function SentimentIcon({ sentimentId, size = 24 }: SentimentIconProps) {
  const getIconAndColor = (): IconConfig => {
    switch (sentimentId) {
      case 13: // Feliz / Alegre
        return { name: 'sunny-outline', color: colors.teal, type: 'Ionicons' };
      case 14: // Triste / Melancólico(a)
        return { name: 'weather-rainy', color: colors.teal, type: 'MaterialCommunityIcons' };
      case 15: // Calmo(a) / Relaxado(a)
        return { name: 'waves', color: colors.teal, type: 'MaterialCommunityIcons' };
      case 16: // Ansioso(a) / Nervoso(a)
        return { name: 'flash-outline', color: colors.teal, type: 'Ionicons' };
      case 17: // Animado(a) / Entusiasmado(a)
        return { name: 'bulb-outline', color: colors.teal, type: 'Ionicons' };
      case 18: // Cansado(a) / Desmotivado(a)
        return { name: 'battery-low', color: colors.teal, type: 'MaterialCommunityIcons' };
      case 19: // Neutro / Indiferente
        return { name: 'swap-horizontal-outline', color: colors.teal, type: 'Ionicons' };
      default:
        return { name: 'help-circle-outline', color: colors.teal, type: 'Ionicons' };
    }
  };

  const { name, color, type } = getIconAndColor();

  return (
    <View style={{ width: size, height: size }}>
      {type === 'Ionicons' ? (
        <Ionicons name={name} size={size} color={color} />
      ) : (
        <MaterialCommunityIcons name={name} size={size} color={color} />
      )}
    </View>
  );
} 