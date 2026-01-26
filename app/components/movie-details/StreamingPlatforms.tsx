import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { getPlatformLogoUrl } from './movieHelpers';

interface Platform {
  accessType: string;
  streamingPlatform?: {
    id: number;
    name: string;
    logoPath: string | null;
    baseUrl?: string;
  };
  id?: number;
  name?: string;
  logoPath?: string | null;
  baseUrl?: string;
}

interface StreamingPlatformsProps {
  platforms?: Platform[];
  sentimentColor: string;
}

export const StreamingPlatforms: React.FC<StreamingPlatformsProps> = React.memo(({
  platforms,
  sentimentColor
}) => {
  const { colors } = useTheme();

  const subscriptionPlatforms = useMemo(() =>
    platforms?.filter(p => p.accessType === 'INCLUDED_WITH_SUBSCRIPTION') || [],
    [platforms]
  );

  const rentalPurchasePlatforms = useMemo(() => {
    if (!platforms) return [];
    const filtered = platforms.filter(p => p.accessType === 'RENTAL' || p.accessType === 'PURCHASE');
    // Unificar plataformas - uma por plataforma, mesmo que tenha múltiplos accessTypes
    const uniquePlatforms = new Map<number, Platform>();

    filtered.forEach(platform => {
      const platformId = (platform.streamingPlatform || platform).id;
      if (platformId && !uniquePlatforms.has(platformId)) {
        uniquePlatforms.set(platformId, platform);
      }
    });

    return Array.from(uniquePlatforms.values());
  }, [platforms]);

  const handlePlatformPress = async (baseUrl?: string) => {
    if (!baseUrl) {
      if (__DEV__) {
        console.log('Plataforma sem URL disponível');
      }
      return;
    }

    try {
      // Verificar se a URL é válida
      const canOpen = await Linking.canOpenURL(baseUrl);

      if (canOpen) {
        await Linking.openURL(baseUrl);
        if (__DEV__) {
          console.log('Abrindo plataforma:', baseUrl);
        }
      } else {
        // Tentar adicionar https:// se não tiver protocolo
        const urlWithProtocol = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        const canOpenWithProtocol = await Linking.canOpenURL(urlWithProtocol);

        if (canOpenWithProtocol) {
          await Linking.openURL(urlWithProtocol);
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível abrir a plataforma. Verifique sua conexão com a internet.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Erro ao abrir plataforma:', error);
      }
      Alert.alert(
        'Erro',
        'Não foi possível abrir a plataforma. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderPlatformLogo = (platform: Platform) => {
    const platformData = platform.streamingPlatform || platform;
    const logoUrl = getPlatformLogoUrl(platformData.logoPath || null);

    return logoUrl ? (
      <Image
        source={{ uri: logoUrl }}
        style={styles.platformLogoImage}
        resizeMode="contain"
      />
    ) : (
      <Ionicons
        name={platform.accessType === 'INCLUDED_WITH_SUBSCRIPTION' ? 'tv' : 'card'}
        size={32}
        color={sentimentColor}
      />
    );
  };

  const hasPlatforms = platforms && platforms.length > 0;

  const styles = useMemo(() => StyleSheet.create({
    streamingSection: {
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    platformsContainer: {
      marginBottom: spacing.sm,
    },
    subscriptionPlatforms: {
      marginBottom: spacing.md,
    },
    rentalPlatforms: {
      marginBottom: spacing.md,
    },
    platformCategoryTitle: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
    },
    platformsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    platformLogoItem: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      backgroundColor: colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
      minHeight: 60,
    },
    platformLogoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    platformLogoImage: {
      width: 60,
      height: 40,
    },
    noPlatformsContainer: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    noPlatformsText: {
      fontSize: typography.fontSize.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    disclaimerText: {
      fontSize: typography.fontSize.small,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <View style={styles.streamingSection}>
      <Text style={styles.sectionTitle}>Onde assistir hoje?</Text>

      <View style={styles.platformsContainer}>
        {/* Plataformas de Assinatura */}
        {subscriptionPlatforms.length > 0 && (
          <View style={styles.subscriptionPlatforms}>
            <Text style={styles.platformCategoryTitle}>Assinatura:</Text>
            <View style={styles.platformsGrid}>
              {subscriptionPlatforms.map((platform, index) => {
                const platformData = platform.streamingPlatform || platform;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.platformLogoItem, { borderColor: sentimentColor + '40' }]}
                    onPress={() => handlePlatformPress(platformData.baseUrl)}
                  >
                    <View style={styles.platformLogoContainer}>
                      {renderPlatformLogo(platform)}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Plataformas de Aluguel ou Compra */}
        {rentalPurchasePlatforms.length > 0 && (
          <View style={styles.rentalPlatforms}>
            <Text style={styles.platformCategoryTitle}>Aluguel ou Compra:</Text>
            <View style={styles.platformsGrid}>
              {rentalPurchasePlatforms.map((platform, index) => {
                const platformData = platform.streamingPlatform || platform;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.platformLogoItem, { borderColor: sentimentColor + '40' }]}
                    onPress={() => handlePlatformPress(platformData.baseUrl)}
                  >
                    <View style={styles.platformLogoContainer}>
                      {renderPlatformLogo(platform)}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Mensagem quando não há plataformas */}
      {!hasPlatforms && (
        <View style={styles.noPlatformsContainer}>
          <Text style={styles.noPlatformsText}>
            Este filme não está disponível para streaming no momento.
          </Text>
        </View>
      )}

      <Text style={styles.disclaimerText}>
        * Os períodos e termos de teste grátis podem variar. Consulte a plataforma para detalhes atualizados.
      </Text>
    </View>
  );
});

StreamingPlatforms.displayName = 'StreamingPlatforms';

