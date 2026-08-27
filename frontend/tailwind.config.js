/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Familia de exhibición del home (titulares) y familia de cuerpo del
        // home (párrafos). Uso restringido al árbol de Landing.jsx.
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
      colors: {
        // Paleta de marca "Ticket100": papel de boleto cálido + tinta negra +
        // azul de marca. Pensada para reutilizarse en todo el sitio, no solo
        // en el home.
        raffle: {
          ink: '#141414',       // fondo modo oscuro — texto principal modo claro
          paper: '#FBF9F4',     // fondo modo claro — papel de boleto cálido
          paperDim: '#F3EFE6',  // superficie secundaria modo claro
          blue: '#0579FB',      // acento primario de marca
          blueLight: '#3E97FF', // brillo / hover del azul
          blueDark: '#0460CC',  // texto sobre azul, estados activos
          tint: '#EAF2FF',      // relleno azul muy claro
          stub: '#C43D4B',      // tinta roja de talonario — urgencia, "agotado"
        },
      },
      boxShadow: {
        blue: '0 0 0 1px rgba(5,121,251,0.25), 0 8px 30px -6px rgba(5,121,251,0.35)',
        ink: '0 20px 60px -15px rgba(20,20,20,0.35)',
      },
    },
  },
  plugins: [],
}
