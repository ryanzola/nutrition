/**
 * FloatingTabBar — pill-shaped bottom tab bar.
 *
 * A rounded floating bar over the app background; the active tab gets a
 * highlighted pill behind its icon and label. Sits in normal layout flow
 * (not absolutely positioned) so screen content never underlaps it.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';

import { theme } from '@/constants/theme';

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Label and icons per route name (file name inside the (tabs) group). */
const TAB_CONFIG: Record<
  string,
  { label: string; icon: IoniconName; iconActive: IoniconName }
> = {
  index: { label: 'Tracker', icon: 'restaurant-outline', iconActive: 'restaurant' },
  weight: { label: 'Weight', icon: 'scale-outline', iconActive: 'scale' },
  settings: { label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
};

export default function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Ionicons
                name={isActive ? config.iconActive : config.icon}
                size={22}
                color={isActive ? theme.colors.textPrimary : theme.colors.textSecondary}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    padding: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
});
