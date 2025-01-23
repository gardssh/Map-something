import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Create a service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete user data from various tables using admin client
    await supabaseAdmin.from('strava_tokens').delete().eq('user_id', userId);
    await supabaseAdmin.from('strava_activities').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Delete the user's auth account using admin client
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    // Sign out the user's session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Error deleting user' },
      { status: 500 }
    );
  }
} 