import { useState, useEffect } from "react";
import { api, type AppSettings } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";
type FontSize = "normal" | "large" | "extralarge";
type CursorSize = "normal" | "large" | "extralarge";

interface ThemeSettings {
  theme: Theme;
  fontSize: FontSize;
  cursorSize: CursorSize;
  dyslexicFont: boolean;
}

/** Chaves editáveis das configurações de tema */
type SettingKey = keyof ThemeSettings;

/** Mapa de valor por chave — permite passar valores heterogêneos com segurança */
type SettingValueMap = {
  [K in SettingKey]: ThemeSettings[K];
};

export interface UseThemeReturn {
  theme: Theme;
  fontSize: FontSize;
  cursorSize: CursorSize;
  dyslexicFont: boolean;
  toggleTheme: () => void;
  updateSetting: <K extends SettingKey>(key: K, value: SettingValueMap[K]) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ThemeSettings = {
  theme: "light",
  fontSize: "normal",
  cursorSize: "normal",
  dyslexicFont: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = (): UseThemeReturn => {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);

  // Load initial settings from backend / JSON file
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await api.getSettings();
        if (savedSettings) {
          setSettings((prev) => ({
            ...prev,
            ...(savedSettings as Partial<ThemeSettings>),
          }));
        }
      } catch (err) {
        console.warn("Erro ao carregar configurações persistentes", err);
      }
    };
    loadSettings();
  }, []);

  // Apply settings to DOM and persist on change
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Apply Theme
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply Font Size
    root.classList.remove("font-size-large", "font-size-extralarge");
    if (settings.fontSize === "large") root.classList.add("font-size-large");
    if (settings.fontSize === "extralarge") root.classList.add("font-size-extralarge");

    // Apply Cursor Size
    body.classList.remove("cursor-large", "cursor-extralarge");
    if (settings.cursorSize === "large") body.classList.add("cursor-large");
    if (settings.cursorSize === "extralarge") body.classList.add("cursor-extralarge");

    // Apply Dyslexic Font
    if (settings.dyslexicFont) {
      body.classList.add("dyslexic-font");
    } else {
      body.classList.remove("dyslexic-font");
    }

    // Persist to backend
    api.saveSettings(settings as unknown as AppSettings);
  }, [settings]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  };

  const updateSetting = <K extends SettingKey>(
    key: K,
    value: SettingValueMap[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    theme: settings.theme,
    fontSize: settings.fontSize,
    cursorSize: settings.cursorSize,
    dyslexicFont: settings.dyslexicFont,
    toggleTheme,
    updateSetting,
  };
};
