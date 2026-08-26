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

// Pasteles suaves para el fondo de la página: cada uno trae su propia variante
// oscura (más profunda, no un pastel deslavado) para que el modo dark se vea
// bien. Las clases .raffle-bg-* viven en index.css.
export const BG_COLORS = {
  default: { label: 'Neutro',       swatch: '#f4f4f5', className: 'raffle-bg-default' },
  blue:    { label: 'Azul',         swatch: '#dbeafe', className: 'raffle-bg-blue' },
  violet:  { label: 'Violeta',      swatch: '#ede9fe', className: 'raffle-bg-violet' },
  pink:    { label: 'Rosa',         swatch: '#fce7f3', className: 'raffle-bg-pink' },
  amber:   { label: 'Ámbar',        swatch: '#fef3c7', className: 'raffle-bg-amber' },
  emerald: { label: 'Esmeralda',    swatch: '#d1fae5', className: 'raffle-bg-emerald' },
  teal:    { label: 'Verde azulado', swatch: '#ccfbf1', className: 'raffle-bg-teal' },
  cyan:    { label: 'Cian',         swatch: '#cffafe', className: 'raffle-bg-cyan' },
  slate:   { label: 'Grafito',      swatch: '#e2e8f0', className: 'raffle-bg-slate' },
};

export const DEFAULT_BG_COLOR_KEY = 'default';

export const getBgColorClass = (key) => (BG_COLORS[key] || BG_COLORS[DEFAULT_BG_COLOR_KEY]).className;
