import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface PaginationDotsProps {
  total: number;
  current: number;
  activeColor?: string;
  inactiveColor?: string;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  total,
  current,
  activeColor = '#FFFFFF',
  inactiveColor = 'rgba(255, 255, 255, 0.3)',
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === current
              ? [styles.dotActive, { backgroundColor: activeColor }]
              : [styles.dotInactive, { backgroundColor: inactiveColor }],
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 99,
  },
  dotActive: {
    width: 24,
    height: 6,
  },
  dotInactive: {
    width: 6,
    height: 6,
  },
});
