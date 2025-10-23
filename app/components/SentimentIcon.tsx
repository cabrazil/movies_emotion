import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fontisto } from '@expo/vector-icons';
import { colors } from "../theme";

type IconType = 'Ionicons' | 'MaterialCommunityIcons' | 'Fontisto';
type IconName = string;

interface SentimentIconProps {
  sentimentId: number;
  size?: number;
  color?: string;
}

interface IconConfig {
  name: IconName;
  type: IconType;
}

export function SentimentIcon({ sentimentId, size = 24, color }: SentimentIconProps) {
  const getIconConfig = (): IconConfig => {
    switch (sentimentId) {
      case 13: // Feliz / Alegre
        return { name: 'sunny-outline', type: 'Ionicons' };
      case 14: // Triste / Melancólico(a)
        return { name: 'weather-rainy', type: 'MaterialCommunityIcons' };
      case 15: // Calmo(a) / Relaxado(a)
        return { name: 'waves', type: 'MaterialCommunityIcons' };
      case 16: // Ansioso(a) / Nervoso(a)
        return { name: 'heartbeat-alt', type: 'Fontisto' };
      case 17: // Animado(a) / Entusiasmado(a)
        return { name: 'flash-outline', type: 'Ionicons' };
      case 18: // Cansado(a) / Desmotivado(a)
        return { name: 'battery-low', type: 'MaterialCommunityIcons' };
      case 19: // Neutro / Indiferente
        return { name: 'swap-horizontal-outline', type: 'Ionicons' };
      default:
        return { name: 'help-circle-outline', type: 'Ionicons' };
    }
  };

  const { name, type } = getIconConfig();
  const iconColor = color || colors.white;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {type === 'Ionicons' && <Ionicons name={name as any} size={size} color={iconColor} />}
      {type === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={name as any} size={size} color={iconColor} />}
      {type === 'Fontisto' && <Fontisto name={name as any} size={size} color={iconColor} />}
    </View>
  );
} 