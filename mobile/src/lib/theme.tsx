// Tema: Sistem / Açık / Koyu. Seçim AsyncStorage'da tutulur; "Sistem"de cihaz
// teması izlenir (app.json userInterfaceStyle: automatic). Renkler bileşenlere
// useColors() ile, stiller makeStyles() ile gelir; tema değişince ekranlar
// yeniden çizilir, uygulamayı yeniden başlatmak gerekmez.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { darkColors, lightColors, type Colors } from "@/theme";

export type ThemePref = "system" | "light" | "dark";
export type Scheme = "light" | "dark";

const STORAGE_KEY = "theme-pref";

type ThemeValue = {
  colors: Colors;
  scheme: Scheme;
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  /** Kayıtlı tercih okunana kadar false (açılış ekranı bekler, renk titremesi olmaz) */
  ready: boolean;
};

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  scheme: "light",
  pref: "system",
  setPref: () => {},
  ready: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setPrefState(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    const op = next === "system" ? AsyncStorage.removeItem(STORAGE_KEY) : AsyncStorage.setItem(STORAGE_KEY, next);
    op.catch(() => {});
  }, []);

  const scheme: Scheme = pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
  const colors = scheme === "dark" ? darkColors : lightColors;

  // Ekran geçişlerinde ve klavye açılırken görünen kök zemin
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  const value = useMemo(() => ({ colors, scheme, pref, setPref, ready }), [colors, scheme, pref, setPref, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

/**
 * Temaya bağlı StyleSheet. Modül düzeyinde tanımlanır, bileşende hook olarak
 * çağrılır; her tema için bir kez oluşturulup önbelleğe alınır.
 *
 *   const useStyles = makeStyles((c) => ({ box: { backgroundColor: c.bg2 } }));
 *   function Box() { const styles = useStyles(); ... }
 */
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function makeStyles<T extends NamedStyles>(factory: (c: Colors) => T): () => T {
  const cache = new Map<Colors, T>();
  return function useStyles() {
    const c = useColors();
    let styles = cache.get(c);
    if (!styles) {
      styles = StyleSheet.create(factory(c));
      cache.set(c, styles);
    }
    return styles;
  };
}
