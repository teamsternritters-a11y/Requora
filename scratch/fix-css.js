import fs from 'fs'

let content = fs.readFileSync('src/index.css', 'utf8')

// Replace @tailwind directives with @import "tailwindcss"
content = content.replace(/@tailwind base;\s*@tailwind components;\s*@tailwind utilities;/g, '@import "tailwindcss";\n@import "./tailwind.config.js";')

fs.writeFileSync('src/index.css', content)
console.log('Fixed Tailwind imports')
