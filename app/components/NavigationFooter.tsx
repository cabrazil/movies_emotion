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
  twoLineText?: boolean;
  customBackRoute?: string;
}

export function NavigationFooter({ 
  backLabel = "Voltar", 
  onBackPress, 
  showHome = false,
  disabled = false,
  showLoadMore = false,
  onLoadMore,
  loadMoreLabel = "Ver Mais",
  loadMoreDisabled = false,
  twoLineText = false,
  customBackRoute
}: NavigationFooterProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (customBackRoute) {
      router.push(customBackRoute);
    } else {
      router.back();
    }
  };

  const handleHomePress = () => {
    router.push('/');
  };

  return (
    <View style={styles.footer}>
      {showHome && (
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHomePress}
        >
          <Ionicons name="home-outline" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.backButton, 
          disabled && styles.disabledButton,
          showHome && styles.buttonWithHome
        ]}
        onPress={handleBackPress}
        disabled={disabled}
      >
        <Ionicons 
          name="arrow-back" 
          size={20} 
          color={disabled ? colors.text.light : colors.text.primary} 
        />
        <View style={styles.textContainer}>
          {twoLineText ? (
            <>
              <Text style={[styles.backButtonText, disabled && styles.disabledText]}>
                Nova
              </Text>
              <Text style={[styles.backButtonText, disabled && styles.disabledText]}>
                Jornada
              </Text>
            </>
          ) : (
            <Text style={[styles.backButtonText, disabled && styles.disabledText]}>
              {backLabel}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {showLoadMore && onLoadMore && (
        <TouchableOpacity
          style={[
            styles.loadMoreButton, 
            loadMoreDisabled && styles.disabledButton
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
    minHeight: 50,
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
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.small * 1.2,
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
    width: 48,
    height: 48,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithHome: {
    flex: 1,
    marginLeft: spacing.md,
  },
  disabledButton: {
    backgroundColor: colors.background.secondary,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.text.light,
  },
}); 