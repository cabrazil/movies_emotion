import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from "../theme";

interface SentimentIconProps {
  sentimentId: number;
  size?: number;
}

export function SentimentIcon({ sentimentId, size = 24 }: SentimentIconProps) {
  const getIconAndColor = () => {
    switch (sentimentId) {
      case 13: // Feliz / Alegre
        return { name: 'sunny', color: colors.yellow, type: 'Ionicons' };
      case 14: // Triste / Melancólico(a)
        return { name: 'weather-rainy', color: colors.gray, type: 'MaterialCommunityIcons' };
      case 15: // Calmo(a) / Relaxado(a)
        return { name: 'waves', color: colors.blue, type: 'MaterialCommunityIcons' };
      case 16: // Ansioso(a) / Nervoso(a)
        return { name: 'flash', color: colors.red, type: 'Ionicons' };
      case 17: // Animado(a) / Entusiasmado(a)
        return { name: 'bulb', color: colors.orange, type: 'Ionicons' };
      case 18: // Cansado(a) / Desmotivado(a)
        return { name: 'battery-low', color: colors.red, type: 'MaterialCommunityIcons' };
      case 19: // Neutro / Indiferente
        return { name: 'swap-horizontal', color: colors.gray, type: 'Ionicons' };
      default:
        return { name: 'swap-horizontal', color: colors.gray, type: 'Ionicons' };
    }
  };

  const { name, color, type } = getIconAndColor();

  return (
    <View style={{ width: size, height: size }}>
      {type === 'Ionicons' ? (
        <Ionicons name={name as any} size={size} color={color} />
      ) : (
        <MaterialCommunityIcons name={name as any} size={size} color={color} />
      )}
    </View>
  );
} 