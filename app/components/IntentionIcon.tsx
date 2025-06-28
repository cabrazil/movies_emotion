import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from "../theme";

type IconType = 'Ionicons' | 'MaterialCommunityIcons';
type IconName = string;

interface IntentionIconProps {
  intentionType: 'PROCESS' | 'TRANSFORM' | 'MAINTAIN' | 'EXPLORE';
  size?: number;
  color?: string;
}

interface IconConfig {
  name: IconName;
  type: IconType;
}

export function IntentionIcon({ intentionType, size = 24, color = colors.white }: IntentionIconProps) {
  const getIconConfig = (): IconConfig => {
    switch (intentionType) {
      case 'PROCESS':
        return { name: 'bar-chart-outline', type: 'Ionicons' };
      case 'TRANSFORM':
        return { name: 'sync-outline', type: 'Ionicons' };
      case 'MAINTAIN':
        return { name: 'lock-closed-outline', type: 'Ionicons' };
      case 'EXPLORE':
        return { name: 'search-outline', type: 'Ionicons' };
      default:
        return { name: 'help-circle-outline', type: 'Ionicons' };
    }
  };

  const { name, type } = getIconConfig();

  return (
    <View style={{ width: size, height: size }}>
      {type === 'Ionicons' && <Ionicons name={name as any} size={size} color={color} />}
      {type === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={name as any} size={size} color={color} />}
    </View>
  );
} 