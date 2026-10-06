import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('./.env', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.join('=').trim()
  }
})

const supabase = createClient(
  envVars['VITE_SUPABASE_URL'],
  envVars['VITE_SUPABASE_ANON_KEY']
)

async function updateCategories() {
  console.log('Deleting physical-products...')
  const { error: delError } = await supabase
    .from('categories')
    .delete()
    .eq('slug', 'physical-products')

  if (delError) console.error('Delete error:', delError.message)
  else console.log('Deleted successfully.')

  const newCategories = [
    { name: 'Electronics', slug: 'electronics', icon: '🔌', sort_order: 6 },
    { name: 'Clothing & Apparel', slug: 'clothing-apparel', icon: '👕', sort_order: 7 },
    { name: 'Home & Furniture', slug: 'home-furniture', icon: '🛋️', sort_order: 8 },
    { name: 'Health & Beauty', slug: 'health-beauty', icon: '🧴', sort_order: 9 },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎲', sort_order: 10 },
    { name: 'Office Supplies', slug: 'office-supplies', icon: '📎', sort_order: 11 },
  ]

  console.log('Inserting new categories...')
  const { error: insError } = await supabase
    .from('categories')
    .insert(newCategories)

  if (insError) console.error('Insert error:', insError.message)
  else console.log('Inserted successfully.')
}

updateCategories()
