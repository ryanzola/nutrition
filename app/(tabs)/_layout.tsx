/**
 * app/(tabs)/_layout.tsx
 *
 * Bottom tab navigation: Tracker (daily log), Weight, and Settings.
 * Uses a custom floating pill-style tab bar adapted to the dark theme.
 */

import React from 'react';
import { Tabs } from 'expo-router';

import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="weight" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
