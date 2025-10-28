import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows } from '../theme';

// Importar o logo do Vibesfilm
const vibesfilmLogo = require('../../assets/logo_header.png');

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  showLogo?: boolean;
  onBackPress?: () => void;
}

export function AppHeader({ showBack = false, title = 'Vibesfilm', showLogo = false, onBackPress }: AppHeaderProps) {
  const router = useRouter();

  // Debug: verificar se showLogo está sendo passado corretamente
  console.log('AppHeader - showLogo:', showLogo, 'title:', title);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {showLogo ? (
          <View style={styles.logoContainer}>
            <Image 
              source={vibesfilmLogo} 
              style={styles.logo}
              resizeMode="contain"
              onError={(error) => console.log('Erro ao carregar logo:', error)}
              onLoad={() => console.log('Logo carregado com sucesso')}
            />
          </View>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}

        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingTop: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 8, // Espaço extra para compensar status bar
    paddingBottom: spacing.lg,
    minHeight: 70,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  logo: {
    height: 45,
    width: 140,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  placeholder: {
    width: 36,
  },
});

