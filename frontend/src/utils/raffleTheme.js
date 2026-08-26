export const RAFFLE_THEMES = {
  blue:    { label: 'Azul',      c1: '#3b82f6', c2: '#8b5cf6' },
  violet:  { label: 'Violeta',   c1: '#8b5cf6', c2: '#d946ef' },
  pink:    { label: 'Rosa',      c1: '#ec4899', c2: '#f43f5e' },
  red:     { label: 'Rojo',      c1: '#f87171', c2: '#dc2626' },
  orange:  { label: 'Naranja',   c1: '#fb923c', c2: '#ea580c' },
  amber:   { label: 'Ámbar',     c1: '#f59e0b', c2: '#b45309' },
  emerald: { label: 'Esmeralda', c1: '#34d399', c2: '#059669' },
  teal:    { label: 'Verde azulado', c1: '#2dd4bf', c2: '#0f766e' },
  cyan:    { label: 'Cian',      c1: '#22d3ee', c2: '#0e7490' },
  indigo:  { label: 'Índigo',    c1: '#818cf8', c2: '#4338ca' },
  slate:   { label: 'Grafito',   c1: '#94a3b8', c2: '#334155' },
};

export const DEFAULT_THEME_KEY = 'blue';

export const getRaffleTheme = (key) => RAFFLE_THEMES[key] || RAFFLE_THEMES[DEFAULT_THEME_KEY];

export const NUMBER_STYLES = {
  rounded: { label: 'Redondeado',  className: 'rounded-xl' },
  square:  { label: 'Cuadrado',    className: 'rounded-md' },
  circle:  { label: 'Circular',    className: 'rounded-full' },
  minimal: { label: 'Minimalista', className: 'rounded-none' },
};

export const DEFAULT_NUMBER_STYLE_KEY = 'rounded';

export const getNumberStyleClass = (key) => (NUMBER_STYLES[key] || NUMBER_STYLES[DEFAULT_NUMBER_STYLE_KEY]).className;
