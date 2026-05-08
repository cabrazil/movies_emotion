import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Gradientes atmosféricos por sentimento (ID → [topo, meio, base])
export const SENTIMENT_GRADIENTS: Record<number, readonly [string, string, string]> = {
  13: ['#1b0b00', '#301800', '#804c00'] as const, // Feliz — Ouro Envelhecido / Whisky
  14: ['#050814', '#0a142e', '#12284c'] as const, // Introspectivo — Azul Espaço Sutil
  15: ['#040d06', '#081a0d', '#0d3617'] as const, // Calmo — Verde Floresta / Pinheiro
  16: ['#0d0411', '#1f0b2b', '#3d1452'] as const, // Ansioso — Roxo Ametista / Lavanda
  17: ['#120404', '#260808', '#521010'] as const, // Animado — Vermelho Vinho / Borgonha
  18: ['#101015', '#1a1a24', '#2c2c3a'] as const, // Cansado — Cinza Slate Confortável
};

// Gradiente da Home (azul escuro elegante)
export const HOME_GRADIENT: readonly [string, string, string, string] = ['#060c1f', '#0a1535', '#0d1a42', '#08102e'] as const;

// Gradiente padrão (quando nenhum sentimento selecionado)
export const DEFAULT_GRADIENT: readonly [string, string, string] = ['#0a0a18', '#0f0f25', '#14142e'] as const;

interface GradientBackgroundProps {
  sentimentId?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  sentimentId,
  children,
  style,
}) => {
  const gradient = sentimentId
    ? (SENTIMENT_GRADIENTS[sentimentId] || DEFAULT_GRADIENT)
    : DEFAULT_GRADIENT;

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.4, 1]}
      style={[styles.gradient, style]}
    >
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
