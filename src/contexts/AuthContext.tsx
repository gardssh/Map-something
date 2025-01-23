'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
	// Memoize the Supabase client
	const supabase = useMemo(() => createClient(), []);

	const refreshSession = async () => {
		try {
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();
			if (sessionError) throw sessionError;

			if (session) {
				setSession(session);
				setUser(session.user);
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

		// Only refresh session when tab becomes visible and we have a session
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && session) {
				refreshSession();
			}
		};

		// Add visibility change listener with a debounce
		let visibilityTimeout: NodeJS.Timeout;
		const debouncedVisibilityHandler = () => {
			clearTimeout(visibilityTimeout);
			visibilityTimeout = setTimeout(handleVisibilityChange, 1000);
		};

		document.addEventListener('visibilitychange', debouncedVisibilityHandler);

		// Cleanup
		return () => {
			mounted = false;
			subscription.unsubscribe();
			document.removeEventListener('visibilitychange', debouncedVisibilityHandler);
			clearTimeout(visibilityTimeout);
		};
	}, [supabase]);

	const signOut = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Clear auth state
			setSession(null);
			setUser(null);

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
