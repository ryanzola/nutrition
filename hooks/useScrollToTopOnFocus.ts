/**
 * hooks/useScrollToTopOnFocus.ts
 *
 * Tab screens stay mounted when switched away from, so scroll positions
 * persist. Attach the returned ref to a screen's ScrollView to reset it
 * to the top whenever the screen regains focus.
 */

import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ScrollView } from 'react-native';

export function useScrollToTopOnFocus() {
  const ref = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      ref.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return ref;
}
