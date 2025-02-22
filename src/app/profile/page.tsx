import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientProfile from './ClientProfile';

// Force dynamic rendering at runtime
export const dynamic = 'force-dynamic';
// Disable all caching for this page
export const revalidate = 0;

// Server Component
export default async function ProfilePage() {
	const cookieStore = cookies();
	const supabase = createServerComponentClient({ cookies: () => cookieStore });

	try {
		// First check if we have an existing session
		const {
			data: { session: existingSession },
			error: sessionError,
		} = await supabase.auth.getSession();
		console.log('Existing session check:', { found: !!existingSession, error: sessionError?.message });

		if (existingSession?.user) {
			console.log('Using existing session user:', existingSession.user.email);
			return <ClientProfile user={existingSession.user} />;
		}

		// If no session, try to get tokens from cookies
		const accessToken = cookieStore.get('sb-access-token')?.value;
		const refreshToken = cookieStore.get('sb-refresh-token')?.value;
		const projectToken = cookieStore.get('sb-kmespwkiycekritowlfo-auth-token')?.value;

		console.log('Profile page tokens:', {
			hasAccessToken: !!accessToken,
			hasRefreshToken: !!refreshToken,
			hasProjectToken: !!projectToken,
		});

		if (!accessToken) {
			console.log('No access token found, redirecting to login');
			redirect('/login');
		}

		// Try to get user with the token first
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(accessToken);

		if (user) {
			console.log('User found with token:', user.email);

			// If we have both tokens, try to set the session
			if (refreshToken) {
				console.log('Setting session with tokens...');
				const { error: setError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				});

				if (setError) {
					console.error('Error setting session:', setError);
					// Continue anyway since we have a valid user
				} else {
					console.log('Session set successfully');
				}
			}

			return <ClientProfile user={user} />;
		}

		if (userError) {
			console.error('Error getting user:', userError);
			redirect('/login');
		}

		console.log('No user found, redirecting to login');
		redirect('/login');
	} catch (error) {
		console.error('Error in ProfilePage:', error);
		redirect('/login');
	}
}
