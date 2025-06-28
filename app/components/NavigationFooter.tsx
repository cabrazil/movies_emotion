import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface NavigationFooterProps {
  backLabel?: string;
  onBackPress?: () => void;
  showHome?: boolean;
  disabled?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
  loadMoreDisabled?: boolean;
}

export function NavigationFooter({ 
  backLabel = "Voltar", 
  onBackPress, 
  showHome = false,
  disabled = false,
  showLoadMore = false,
  onLoadMore,
  loadMoreLabel = "Ver Mais",
  loadMoreDisabled = false
}: NavigationFooterProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleHomePress = () => {
    router.push('/');
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[
          styles.backButton, 
          disabled && styles.disabledButton,
          (showLoadMore || showHome) && styles.buttonWithSiblings
        ]}
        onPress={handleBackPress}
        disabled={disabled}
      >
        <Ionicons 
          name="arrow-back" 
          size={20} 
          color={disabled ? colors.text.light : colors.text.primary} 
        />
        <Text style={[styles.backButtonText, disabled && styles.disabledText]}>
          {backLabel}
        </Text>
      </TouchableOpacity>

      {showLoadMore && onLoadMore && (
        <TouchableOpacity
          style={[
            styles.loadMoreButton, 
            loadMoreDisabled && styles.disabledButton,
            showHome && styles.buttonWithSiblings
          ]}
          onPress={onLoadMore}
          disabled={loadMoreDisabled}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={20} 
            color={loadMoreDisabled ? colors.text.light : colors.primary.main} 
          />
          <Text style={[styles.loadMoreButtonText, loadMoreDisabled && styles.disabledText]}>
            {loadMoreLabel}
          </Text>
        </TouchableOpacity>
      )}

      {showHome && (
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHomePress}
        >
          <Ionicons name="home-outline" size={20} color={colors.primary.main} />
          <Text style={styles.homeButtonText}>Início</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
    ...shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  buttonWithSiblings: {
    flex: 0.5,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  loadMoreButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  homeButtonText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  disabledButton: {
    backgroundColor: colors.background.secondary,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.text.light,
  },
}); 