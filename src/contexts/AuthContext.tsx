'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

type AuthContextType = {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: true,
	signOut: async () => {},
	refreshSession: async () => {},
});

export const useAuth = () => {
	return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	const refreshSession = async () => {
		try {
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();
			if (sessionError) {
				console.error('Session refresh error:', {
					error: sessionError,
					message: sessionError.message,
					status: sessionError.status,
				});
				throw sessionError;
			}

			if (session) {
				const {
					data: { user: freshUser },
					error: userError,
				} = await supabase.auth.getUser();
				if (userError) {
					console.error('Get user error:', {
						error: userError,
						message: userError.message,
						status: userError.status,
					});
					throw userError;
				}
				setSession(session);
				setUser(freshUser);
			}
		} catch (error) {
			console.error('Error refreshing session:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let mounted = true;

		// Get initial session
		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				if (!mounted) return;

				setSession(session);
				setUser(session?.user ?? null);
				setLoading(false);

				// Refresh session after initial load to get fresh data
				if (session) {
					refreshSession();
				}
			})
			.catch((error) => {
				console.error('Error getting session:', error);
				if (mounted) setLoading(false);
			});

		// Listen for changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!mounted) return;

			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Add visibility change listener
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				refreshSession();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Cleanup
		return () => {
			mounted = false;
			subscription.unsubscribe();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const signOut = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Clear auth state
			setSession(null);
			setUser(null);

			// Clear any stored auth data
			localStorage.removeItem('supabase.auth.token');

			// Force reload the page to clear any cached state
			window.location.href = '/';
		} catch (error) {
			console.error('Error signing out:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>{children}</AuthContext.Provider>
	);
}
