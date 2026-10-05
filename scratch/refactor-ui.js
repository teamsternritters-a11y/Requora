import fs from 'fs'
import path from 'path'

// 1. Rewrite tailwind.config.js
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#00695c',
          600: '#004d40',
          700: '#003d33',
          800: '#00251a',
          900: '#00140d',
          950: '#000a06',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        surface: {
          DEFAULT: '#ffffff',
          50: '#0f172a', // Text primary
          100: '#1e293b', // Text secondary
          200: '#334155', // Text tertiary
          300: '#475569', // Text muted
          400: '#64748b', // Text lighter
          500: '#94a3b8',
          600: '#cbd5e1', // Borders hover
          700: '#e2e8f0', // Borders
          800: '#ffffff', // Card backgrounds
          900: '#f8fafc', // App background
          950: '#f1f5f9', // App background alt
        },
      }
    },
  },
  plugins: [],
}
`
fs.writeFileSync('tailwind.config.js', tailwindConfig)

// 2. Rewrite index.css
const indexCss = `/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-card: #ffffff;
    --border-color: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-surface-900 text-surface-50 font-sans;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    @apply bg-brand-500/20 text-brand-700;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
}

@layer components {
  /* Cards */
  .glass-card {
    @apply bg-white border border-surface-700 rounded-2xl shadow-sm;
  }

  .glass-card-hover {
    @apply glass-card transition-all duration-300;
  }
  .glass-card-hover:hover {
    @apply shadow-md border-surface-600;
    transform: translateY(-2px);
  }

  /* Buttons */
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
           bg-brand-600 text-white hover:bg-brand-700
           active:scale-95 transition-all duration-200 shadow-sm;
  }
  .btn-primary:disabled {
    @apply opacity-50 cursor-not-allowed active:scale-100;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
           bg-white text-surface-50 border border-surface-700 shadow-sm
           hover:bg-surface-950 hover:border-surface-600
           active:scale-95 transition-all duration-200;
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
           text-surface-200 hover:bg-surface-700 hover:text-surface-50
           active:scale-95 transition-all duration-200;
  }

  .btn-danger {
    @apply inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
           bg-red-50 text-red-600 border border-red-200
           hover:bg-red-100 hover:text-red-700
           active:scale-95 transition-all duration-200;
  }

  /* Inputs */
  .input-field {
    @apply w-full px-4 py-2.5 rounded-xl bg-white border border-surface-700 text-surface-50
           placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
           transition-all duration-200 text-sm shadow-sm;
  }
  .input-field:hover {
    @apply border-surface-600;
  }

  .input-label {
    @apply block text-sm font-medium text-surface-100 mb-1.5;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold;
  }
  .badge-brand {
    @apply badge bg-brand-50 text-brand-700 border border-brand-200;
  }
  .badge-accent {
    @apply badge bg-accent-50 text-accent-700 border border-accent-200;
  }
  .badge-green {
    @apply badge bg-emerald-50 text-emerald-700 border border-emerald-200;
  }
  .badge-yellow {
    @apply badge bg-yellow-50 text-yellow-700 border border-yellow-200;
  }
  .badge-red {
    @apply badge bg-red-50 text-red-700 border border-red-200;
  }
  .badge-gray {
    @apply badge bg-surface-950 text-surface-200 border border-surface-700;
  }

  /* Score Ring */
  .score-ring {
    @apply relative inline-flex items-center justify-center rounded-full;
  }

  /* Sidebar Link */
  .nav-link {
    @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-200
           transition-all duration-200 hover:bg-surface-700 hover:text-surface-50;
  }
  .nav-link.active {
    @apply bg-brand-50 text-brand-700 font-semibold;
  }
}
`
fs.writeFileSync('src/index.css', indexCss)

// 3. Remove hardcoded dark mode colors in all .tsx files
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f)
    let isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f))
  })
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8')
    let original = content

    // Replace generic text colors that might contrast poorly on white
    content = content.replace(/text-white/g, 'text-surface-50')
    content = content.replace(/text-white\/60/g, 'text-surface-300')
    content = content.replace(/text-white\/40/g, 'text-surface-400')
    
    // Some buttons legitimately use text-white, like btn-primary. 
    // We shouldn't blindly replace text-white everywhere. Let's rely on standard classes.
    // Let's revert text-white replacement and be more surgical.
    content = original
    
    content = content.replace(/bg-\[rgba\(255,255,255,0\.05\)\]/g, 'bg-surface-800')
    content = content.replace(/bg-\[rgba\(255,255,255,0\.08\)\]/g, 'bg-surface-700')
    content = content.replace(/bg-white\/5/g, 'bg-surface-800')
    content = content.replace(/bg-white\/10/g, 'bg-surface-700')
    content = content.replace(/bg-white\/20/g, 'bg-surface-700')
    
    content = content.replace(/border-\[rgba\(255,255,255,0\.1\)\]/g, 'border-surface-700')
    content = content.replace(/border-\[rgba\(255,255,255,0\.08\)\]/g, 'border-surface-700')
    content = content.replace(/border-white\/10/g, 'border-surface-700')
    content = content.replace(/border-white\/20/g, 'border-surface-600')
    
    // Hardcoded hover states
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-surface-700')
    content = content.replace(/hover:bg-white\/10/g, 'hover:bg-surface-600')
    content = content.replace(/hover:bg-\[rgba\(255,255,255,0\.08\)\]/g, 'hover:bg-surface-700')
    
    // Navbar specific - make it white
    content = content.replace(/bg-surface-900\/80/g, 'bg-white/90')
    content = content.replace(/border-b border-surface-800/g, 'border-b border-surface-700')
    
    if (content !== original) {
      fs.writeFileSync(filePath, content)
    }
  }
})
console.log('UI refactored for light theme')
