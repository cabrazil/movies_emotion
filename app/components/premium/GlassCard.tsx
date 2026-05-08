import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';

// Tenta importar o BlurView — se falhar (Expo Go), usa fallback
let BlurView: any = null;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  // expo-blur não disponível (Expo Go), usa fallback
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  tint?: 'dark' | 'light' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  borderColor = 'rgba(255, 255, 255, 0.15)',
  borderWidth = 1,
  borderRadius = 20,
  tint = 'dark',
}) => {
  const cardStyle = [
    styles.base,
    { borderColor, borderWidth, borderRadius },
    style,
  ];

  // BlurView nativo (iOS com development build ou SDK compatível)
  if (BlurView && Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint={tint} style={cardStyle}>
        {children}
      </BlurView>
    );
  }

  // Fallback para Android e Expo Go — semi-transparência elegante
  return (
    <View style={[cardStyle, styles.fallback]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
});
