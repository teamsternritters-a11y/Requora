import fs from 'fs'
import path from 'path'

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

    // Backgrounds and overlays
    content = content.replace(/bg-surface-900\/80/g, 'bg-white/90')
    content = content.replace(/bg-surface-800\/50/g, 'bg-surface-800/50')
    
    // Replace text-white with text-surface-50 EXCEPT where it makes sense (like inside a brand badge/button)
    // Actually, most text-white in this app were used for headings.
    // Let's replace text-white with text-surface-50 everywhere, but then fix known cases.
    content = content.replace(/text-white\/40/g, 'text-surface-400')
    content = content.replace(/text-white\/60/g, 'text-surface-300')
    content = content.replace(/text-white\/70/g, 'text-surface-300')
    content = content.replace(/text-white\/80/g, 'text-surface-200')
    content = content.replace(/text-white/g, 'text-surface-50')
    
    // Fix exceptions where text-white is needed
    // 1. Text inside brand-500 or brand-600 badges/buttons
    content = content.replace(/bg-brand-500([^>]+)text-surface-50/g, 'bg-brand-500$1text-white')
    content = content.replace(/bg-brand-600([^>]+)text-surface-50/g, 'bg-brand-600$1text-white')
    content = content.replace(/bg-gradient-brand([^>]+)text-surface-50/g, 'bg-gradient-brand$1text-white')
    content = content.replace(/btn-primary([^>]+)text-surface-50/g, 'btn-primary$1text-white')
    
    // Hardcoded white opacities
    content = content.replace(/bg-white\/5/g, 'bg-surface-800')
    content = content.replace(/bg-white\/8/g, 'bg-surface-800')
    content = content.replace(/bg-white\/10/g, 'bg-surface-700')
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-surface-800')
    content = content.replace(/hover:bg-white\/8/g, 'hover:bg-surface-700')
    content = content.replace(/hover:bg-white\/10/g, 'hover:bg-surface-700')
    content = content.replace(/hover:bg-white\/20/g, 'hover:bg-surface-600')
    content = content.replace(/border-white\/10/g, 'border-surface-700')
    content = content.replace(/border-white\/5/g, 'border-surface-700')
    content = content.replace(/border-white\/20/g, 'border-surface-600')
    
    // Other common dark mode hardcoded things
    content = content.replace(/bg-\[rgba\(255,255,255,0\.05\)\]/g, 'bg-surface-800')
    content = content.replace(/bg-\[rgba\(255,255,255,0\.08\)\]/g, 'bg-surface-700')
    content = content.replace(/border-\[rgba\(255,255,255,0\.1\)\]/g, 'border-surface-700')
    content = content.replace(/hover:bg-\[rgba\(255,255,255,0\.15\)\]/g, 'hover:bg-surface-600')

    // Fix brand gradients
    content = content.replace(/from-surface-900 to-surface-800/g, 'from-surface-900 to-surface-800')
    
    if (content !== original) {
      fs.writeFileSync(filePath, content)
    }
  }
})
console.log('UI refactored deeply for light theme')
