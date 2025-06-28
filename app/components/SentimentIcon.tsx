import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fontisto } from '@expo/vector-icons';
import { colors } from "../theme";

type IconType = 'Ionicons' | 'MaterialCommunityIcons' | 'Fontisto';
type IconName = string;

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
        return { name: 'sunny-outline', color: colors.white, type: 'Ionicons' };
      case 14: // Triste / Melancólico(a)
        return { name: 'weather-rainy', color: colors.white, type: 'MaterialCommunityIcons' };
      case 15: // Calmo(a) / Relaxado(a)
        return { name: 'waves', color: colors.white, type: 'MaterialCommunityIcons' };
      case 16: // Ansioso(a) / Nervoso(a)
        return { name: 'heartbeat-alt', color: colors.white, type: 'Fontisto' };
      case 17: // Animado(a) / Entusiasmado(a)
        return { name: 'flash-outline', color: colors.white, type: 'Ionicons' };
      case 18: // Cansado(a) / Desmotivado(a)
        return { name: 'battery-low', color: colors.white, type: 'MaterialCommunityIcons' };
      case 19: // Neutro / Indiferente
        return { name: 'swap-horizontal-outline', color: colors.white, type: 'Ionicons' };
      default:
        return { name: 'help-circle-outline', color: colors.white, type: 'Ionicons' };
    }
  };

  const { name, color, type } = getIconAndColor();

  return (
    <View style={{ width: size, height: size }}>
      {type === 'Ionicons' && <Ionicons name={name as any} size={size} color={color} />}
      {type === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={name as any} size={size} color={color} />}
      {type === 'Fontisto' && <Fontisto name={name as any} size={size} color={color} />}
    </View>
  );
} 