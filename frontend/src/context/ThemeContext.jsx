import { createContext, useContext, useEffect, useState } from 'react';

const THEMES = ['dark', 'light', 'darker', 'midnight'];

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme');
    return THEMES.includes(stored) ? stored : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function setTheme(t) {
    if (THEMES.includes(t)) setThemeState(t);
  }

  function toggleTheme() {
    // Cycles: dark → light → darker → midnight → dark
    const idx = THEMES.indexOf(theme);
    setThemeState(THEMES[(idx + 1) % THEMES.length]);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
