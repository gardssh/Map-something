import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function listTokens() {
  const { data, error } = await supabase
    .from('strava_tokens')
    .select('*')

  if (error) {
    console.error('Error fetching tokens:', error)
    return
  }

  console.log('Stored tokens:', JSON.stringify(data, null, 2))
}

// Run if called directly
if (require.main === module) {
  listTokens().catch(console.error)
} 