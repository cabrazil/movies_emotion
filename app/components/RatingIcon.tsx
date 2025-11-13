import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

// Importar apenas os ícones PNG que funcionam no React Native
const tmdbIcon = require('../../assets/ratings/themoviedb.png');
const imdbIcon = require('../../assets/ratings/imdb.png');
const rottenIcon = require('../../assets/ratings/rottentomatoes.png');
const metacriticIcon = require('../../assets/ratings/metascore.png');

interface RatingIconProps {
  type: 'tmdb' | 'imdb' | 'rotten' | 'metacritic';
  rating: string | number;
  size?: number;
}

export const RatingIcon: React.FC<RatingIconProps> = ({ 
  type, 
  rating, 
  size = 40 
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'tmdb':
        return {
          realIcon: tmdbIcon,
          fallbackIcon: 'film' as const,
          fallbackColor: '#01B4E4',
          label: 'TMDB',
        };
      case 'imdb':
        return {
          realIcon: imdbIcon,
          fallbackIcon: 'star' as const,
          fallbackColor: '#F5C518',
          label: 'IMDb',
        };
      case 'rotten':
        return {
          realIcon: rottenIcon,
          fallbackIcon: 'thumbs-up' as const,
          fallbackColor: '#FA320A',
          label: 'RT',
        };
      case 'metacritic':
        return {
          realIcon: metacriticIcon,
          fallbackIcon: 'checkmark-circle' as const,
          fallbackColor: '#6C3',
          label: 'MC',
        };
      default:
        return {
          realIcon: null,
          fallbackIcon: 'star' as const,
          fallbackColor: colors.text.secondary,
          label: 'N/A',
        };
    }
  };

  const config = getIconConfig();

  // Tamanhos específicos para balancear o peso visual
  const getIconSize = () => {
    switch (type) {
      case 'rotten':
        return 26; // Rotten Tomatoes - menor para compensar peso visual
      case 'imdb':
        return 32; // IMDb - reduzido para ficar mais próximo dos outros
      case 'tmdb':
        return 28; // TMDB - reduzido para ficar mais próximo dos outros
      case 'metacritic':
        return 36; // Metacritic - tamanho padrão
      default:
        return size;
    }
  };

  const iconSize = getIconSize();

  return (
    <View style={styles.container}>
      {config.realIcon ? (
        <Image 
          source={config.realIcon} 
          style={[styles.iconImage, { width: iconSize, height: iconSize }]}
          resizeMode="contain"
          onError={(error) => {
            if (__DEV__) {
              console.error(`❌ Erro ao carregar ícone ${type}:`, error);
            }
          }}
        />
      ) : (
        <Ionicons 
          name={config.fallbackIcon} 
          size={iconSize} 
          color={config.fallbackColor} 
        />
      )}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
};

// Componente para exibir múltiplos ratings
interface RatingRowProps {
  ratings: {
    tmdb?: string | number;
    imdb?: string | number;
    rotten?: string | number;
    metacritic?: string | number;
  };
}

export const RatingRow: React.FC<RatingRowProps> = ({ ratings }) => {
  return (
    <View style={styles.rowContainer}>
      {ratings.tmdb && <RatingIcon type="tmdb" rating={ratings.tmdb} />}
      {ratings.imdb && <RatingIcon type="imdb" rating={ratings.imdb} />}
      {ratings.rotten && <RatingIcon type="rotten" rating={ratings.rotten} />}
      {ratings.metacritic && <RatingIcon type="metacritic" rating={ratings.metacritic} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconImage: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});