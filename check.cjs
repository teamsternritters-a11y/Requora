require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: d, error: e1 } = await supabase.from('deliveries').select('id, status, order_id').limit(10);
  console.log('Deliveries:', d, e1);
  const { data: o, error: e2 } = await supabase.from('orders').select('id, status').limit(10);
  console.log('Orders:', o, e2);
}
check();
