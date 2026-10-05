const fs = require('fs')

let content = fs.readFileSync('src/types/database.ts', 'utf8')

// Replace Update: Partial<...> with the corresponding Insert block but with all properties optional
let newContent = content.replace(/Insert: \{([\s\S]*?)\}\s*Update: Partial<Database\['public'\]\['Tables'\]\['\w+'\]\['Insert'\]>/g, (match, insertBlock) => {
  let updateBlock = insertBlock.split('\n').map(line => {
    if (line.includes(':')) {
      return line.replace(/(\w+)(\??):/, '$1?:')
    }
    return line
  }).join('\n')
  return `Insert: {${insertBlock}}\n        Update: {${updateBlock}}`
})

fs.writeFileSync('src/types/database.ts', newContent)
console.log('Fixed database.ts')
