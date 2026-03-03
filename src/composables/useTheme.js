import { ref } from "vue";

const THEME_KEY = "fenius-theme";
const THEMES = ["light", "dark", "high-contrast"];
const currentTheme = ref("light");
let initialized = false;

function applyTheme(theme) {
  if (!THEMES.includes(theme)) return;
  currentTheme.value = theme;

  const root = document.documentElement;
  root.classList.remove("dark", "high-contrast");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "high-contrast") root.classList.add("high-contrast");

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {
    void 0;
  }
}

function resolveInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEMES.includes(saved)) return saved;
  } catch (_) {
    void 0;
  }

  if (window.matchMedia && window.matchMedia("(prefers-contrast: more)").matches) {
    return "high-contrast";
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function useTheme() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    applyTheme(resolveInitialTheme());
  }

  return {
    themes: THEMES,
    currentTheme,
    setTheme: applyTheme,
  };
}
