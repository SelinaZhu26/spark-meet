import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Appearance, Platform, StyleSheet } from 'react-native';

import { MarkPalettes, Palettes, type ColorScheme, type Palette } from '@/constants/theme';

const STORAGE_KEY = 'spark.appearance';

type AppearanceValue = {
  scheme: ColorScheme;
  colors: Palette;
  marks: (typeof MarkPalettes)[ColorScheme];
  setScheme: (scheme: ColorScheme) => void;
};

const AppearanceContext = createContext<AppearanceValue | null>(null);

/** Dark unless you picked light. `localStorage` is installed by expo-sqlite on native. */
function storedScheme(): ColorScheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(storedScheme);

  const setScheme = useCallback((next: ColorScheme) => {
    setSchemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered across launches, but still applied now.
    }
  }, []);

  // Native pieces like the keyboard follow the app's scheme, not the phone's. Web has no override.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(scheme);
    }
  }, [scheme]);

  return (
    <AppearanceContext
      value={{ scheme, colors: Palettes[scheme], marks: MarkPalettes[scheme], setScheme }}>
      {children}
    </AppearanceContext>
  );
}

export function useAppearance(): AppearanceValue {
  const value = use(AppearanceContext);
  if (!value) {
    throw new Error('useAppearance must be used inside AppearanceProvider');
  }
  return value;
}

export function useColors(): Palette {
  return useAppearance().colors;
}

/**
 * A stylesheet built once per color scheme; the returned hook picks the current one.
 *
 *     const useStyles = themedStyles((colors) => ({ screen: { backgroundColor: colors.background } }));
 */
export function themedStyles<S extends Styles>(make: (colors: Palette) => S & Styles) {
  const sheets = {
    dark: StyleSheet.create(make(Palettes.dark)),
    light: StyleSheet.create(make(Palettes.light)),
  };
  return function useThemedStyles() {
    return sheets[useAppearance().scheme];
  };
}

type Styles = Parameters<typeof StyleSheet.create>[0];
