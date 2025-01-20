import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const APP_URL = process.env.WEBHOOK_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://kart.gardsh.no/api/strava/webhook'
    : 'http://localhost:3000/api/strava/webhook'
)

export async function createWebhookSubscription() {
  try {
    // Verify required environment variables
    if (!process.env.NEXT_PUBLIC_STRAVA_ID) throw new Error('NEXT_PUBLIC_STRAVA_ID is required')
    if (!process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET) throw new Error('NEXT_PUBLIC_STRAVA_CLIENT_SECRET is required')
    if (!process.env.STRAVA_VERIFY_TOKEN) throw new Error('STRAVA_VERIFY_TOKEN is required')

    // Log the URL we're using for debugging
    console.log('Using callback URL:', `${APP_URL}/verify`)

    const response = await fetch(`${STRAVA_API_BASE}/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
        callback_url: `${APP_URL}/verify`,
        verify_token: process.env.STRAVA_VERIFY_TOKEN,
      }),
    })

    const data = await response.json()
    console.log('Webhook subscription created:', data)
    return data
  } catch (error) {
    console.error('Error creating webhook subscription:', error)
    throw error
  }
}

export async function listWebhookSubscriptions() {
  try {
    if (!process.env.NEXT_PUBLIC_STRAVA_ID) throw new Error('NEXT_PUBLIC_STRAVA_ID is required')
    if (!process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET) throw new Error('NEXT_PUBLIC_STRAVA_CLIENT_SECRET is required')

    const response = await fetch(
      `${STRAVA_API_BASE}/push_subscriptions?${new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
      })}`,
    )

    const data = await response.json()
    console.log('Current webhook subscriptions:', data)
    return data
  } catch (error) {
    console.error('Error listing webhook subscriptions:', error)
    throw error
  }
}

export async function deleteWebhookSubscription(id: number) {
  try {
    if (!process.env.NEXT_PUBLIC_STRAVA_ID) throw new Error('NEXT_PUBLIC_STRAVA_ID is required')
    if (!process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET) throw new Error('NEXT_PUBLIC_STRAVA_CLIENT_SECRET is required')

    const response = await fetch(
      `${STRAVA_API_BASE}/push_subscriptions/${id}?${new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
      })}`,
      {
        method: 'DELETE',
      }
    )

    if (response.status === 204) {
      console.log('Webhook subscription deleted successfully')
      return true
    }
    
    const data = await response.json()
    console.error('Error deleting webhook subscription:', data)
    return false
  } catch (error) {
    console.error('Error deleting webhook subscription:', error)
    throw error
  }
}

// CLI handling
async function main() {
  const command = process.argv[2]
  const subscriptionId = process.argv[3]

  switch (command) {
    case 'create':
      await createWebhookSubscription()
      break
    case 'list':
      await listWebhookSubscriptions()
      break
    case 'delete':
      if (!subscriptionId) {
        console.error('Subscription ID is required for delete command')
        process.exit(1)
      }
      await deleteWebhookSubscription(Number(subscriptionId))
      break
    default:
      console.log(`
Usage:
  yarn webhook create         Create a new webhook subscription
  yarn webhook list          List all webhook subscriptions
  yarn webhook delete <id>   Delete a webhook subscription
      `)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
} 