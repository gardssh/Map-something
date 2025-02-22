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
		// Check session server-side
		const {
			data: { session },
			error: sessionError,
		} = await supabase.auth.getSession();

		if (sessionError) {
			console.error('Error getting session:', sessionError);
			redirect('/login');
		}

		if (!session) {
			redirect('/login');
		}

		// Render the client component with user data
		return <ClientProfile user={session.user} />;
	} catch (error) {
		console.error('Error in ProfilePage:', error);
		redirect('/login');
	}
}
