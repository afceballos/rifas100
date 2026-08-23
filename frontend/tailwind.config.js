/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Familia de exhibición: titulares y cifras grandes tipo "boleto premiado".
        // Uso restringido a H1/H2 y números destacados, nunca en cuerpo de texto.
        display: ['"Fraunces"', 'serif'],
      },
      colors: {
        // Paleta "boleto de rifa": noche de gala (morado profundo) + lámina dorada
        // + papel de boleto (marfil) + tinta roja de talonario. Pensada para
        // reutilizarse en todo el sitio, no solo en el home.
        raffle: {
          ink: '#170B26',       // fondo modo oscuro — noche de gala
          plum: '#3D1550',      // superficie modo oscuro — terciopelo
          plumLight: '#5C2470', // superficie hover / borde modo oscuro
          gold: '#E8B84B',      // acento primario — lámina dorada
          goldLight: '#F6D77A', // brillo / gradiente / hover del dorado
          goldDark: '#B8862E',  // texto sobre dorado, sombras
          paper: '#FDF6E9',     // fondo modo claro — papel de boleto
          paperDim: '#F3E8D2',  // superficie modo claro
          stub: '#C43D4B',      // tinta roja de talonario — urgencia, "agotado"
        },
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(232,184,75,0.35), 0 8px 30px -6px rgba(232,184,75,0.35)',
        plum: '0 20px 60px -15px rgba(23,11,38,0.6)',
      },
      backgroundImage: {
        'gold-foil': 'linear-gradient(135deg, #F6D77A 0%, #E8B84B 45%, #B8862E 100%)',
        'velvet': 'radial-gradient(120% 120% at 50% 0%, #3D1550 0%, #170B26 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
