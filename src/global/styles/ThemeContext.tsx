import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { ThemeProvider } from "styled-components/native";
import { darkTheme, lightTheme } from "./theme";

type ThemePreference = "system" | "light" | "dark";
interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "@fixar/theme-preference";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function FixarThemeProvider({ children }: React.PropsWithChildren) {
  const systemTheme = useColorScheme() === "dark" ? "dark" : "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "system" || stored === "light" || stored === "dark") setPreferenceState(stored);
    }).catch(() => undefined);
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  };
  const resolvedTheme = preference === "system" ? systemTheme : preference;
  const value = useMemo(() => ({
    preference, resolvedTheme, setPreference,
    toggleTheme: () => setPreference(resolvedTheme === "dark" ? "light" : "dark"),
  }), [preference, resolvedTheme]);

  return <ThemeContext.Provider value={value}>
    <ThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>{children}</ThemeProvider>
  </ThemeContext.Provider>;
}

export function useFixarTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useFixarTheme deve ser usado dentro de FixarThemeProvider");
  return value;
}
