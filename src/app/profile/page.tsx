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
		// Get tokens from cookies
		const accessToken = cookieStore.get('sb-access-token')?.value;
		const refreshToken = cookieStore.get('sb-refresh-token')?.value;

		console.log('Profile page tokens:', {
			hasAccessToken: !!accessToken,
			hasRefreshToken: !!refreshToken,
		});

		// Try to set session if we have both tokens
		if (accessToken && refreshToken) {
			console.log('Setting session with tokens...');
			const { error: sessionError } = await supabase.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken,
			});

			if (sessionError) {
				console.error('Error setting session:', sessionError);
				redirect('/login');
			}
			console.log('Session set successfully');
		}

		// Get the user
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError) {
			console.error('Error getting user:', userError);
			redirect('/login');
		}

		if (!user) {
			console.log('No user found, redirecting to login');
			redirect('/login');
		}

		console.log('User found:', user.email);

		// Render the client component with user data
		return <ClientProfile user={user} />;
	} catch (error) {
		console.error('Error in ProfilePage:', error);
		redirect('/login');
	}
}
