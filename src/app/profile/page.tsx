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
		// Get the user directly instead of checking session
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

		// Render the client component with user data
		return <ClientProfile user={user} />;
	} catch (error) {
		console.error('Error in ProfilePage:', error);
		redirect('/login');
	}
}
