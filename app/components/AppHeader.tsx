import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.light,
    letterSpacing: 0.5,
  },
  logo: {
    height: 32,
    width: 120,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
});

