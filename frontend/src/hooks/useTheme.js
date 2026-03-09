import { useState, useEffect } from "react";
import { api } from "../services/api";

export const useTheme = () => {
  const [settings, setSettings] = useState({
    theme: "light",
    fontSize: "normal",
    cursorSize: "normal",
    dyslexicFont: false,
  });

  // Load initial settings from JSON file via API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await api.getSettings();
        if (savedSettings) {
          setSettings((prev) => ({
            ...prev,
            ...savedSettings,
          }));
        }
      } catch (err) {
        console.warn("Erro ao carregar configurações persistentes", err);
      }
    };
    loadSettings();
  }, []);

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
    if (settings.fontSize === "extralarge")
      root.classList.add("font-size-extralarge");

    // Apply Cursor Size
    body.classList.remove("cursor-large", "cursor-extralarge");
    if (settings.cursorSize === "large") body.classList.add("cursor-large");
    if (settings.cursorSize === "extralarge")
      body.classList.add("cursor-extralarge");

    // Apply Dyslexic Font
    if (settings.dyslexicFont) {
      body.classList.add("dyslexic-font");
    } else {
      body.classList.remove("dyslexic-font");
    }

    // Persist to backend JSON
    api.saveSettings(settings);
  }, [settings]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
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
