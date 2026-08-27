import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const THEME_KEY = 'ticketvault_theme';

// Por defecto claro; solo oscuro si el usuario lo eligió explícitamente antes.
const getInitialTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
};

// variant="dark": para chrome que es siempre oscuro (p.ej. el header del home
// sobre el hero técnico), donde las clases `dark:` normales no aplican porque
// el fondo no depende de si el sitio está en modo oscuro.
export default function ThemeToggle({ variant }) {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch { /* localStorage no disponible */ }
  }, [isDark]);

  const className = variant === 'dark'
    ? 'p-2 rounded-full bg-[#ECEDE7]/10 text-[#ECEDE7]/80 hover:bg-[#ECEDE7]/15 transition-colors'
    : 'p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors';

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={className}
      title="Cambiar tema"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
