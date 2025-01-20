import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
  {
    auth: {
      persistSession: false
    }
  }
)

async function listActivities() {
  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching activities:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No activities found')
    return
  }

  console.log('Recent activities:')
  data.forEach((activity, index) => {
    console.log(`\n${index + 1}. ${activity.name}`)
    console.log(`   Type: ${activity.type}`)
    console.log(`   Distance: ${(activity.distance / 1000).toFixed(2)} km`)
    console.log(`   Date: ${new Date(activity.start_date).toLocaleString()}`)
  })
}

// Run if called directly
if (require.main === module) {
  listActivities().catch(console.error)
} 