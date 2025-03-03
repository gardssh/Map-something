'use client';

import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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
	// Add a ref to track the last refresh time to prevent excessive refreshing
	const lastRefreshTime = useRef<number>(0);
	const refreshCooldown = 5000; // 5 seconds cooldown between refreshes

	const refreshSession = async () => {
		try {
			// Check if we're within the cooldown period
			const now = Date.now();
			if (now - lastRefreshTime.current < refreshCooldown) {
				console.log('AuthContext: Skipping refresh - within cooldown period');
				return;
			}

			// Update the last refresh time
			lastRefreshTime.current = now;

			console.log('AuthContext: Refreshing session');
			setLoading(true);

			// First try to get the session
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError) {
				console.error('AuthContext: Error getting session:', sessionError);

				// Try to refresh the session if we have a current session
				if (session) {
					console.log('AuthContext: Attempting to refresh token');
					const { data, error } = await supabase.auth.refreshSession();

					if (error) {
						console.error('AuthContext: Error refreshing token:', error);
						throw error;
					}

					if (data.session) {
						console.log('AuthContext: Session refreshed successfully');
						setSession(data.session);
						setUser(data.session.user);
						return;
					}
				}

				throw sessionError;
			}

			if (session) {
				console.log('AuthContext: Session found:', session.user.email);
				setSession(session);
				setUser(session.user);
			} else {
				console.log('AuthContext: No session found');
				setSession(null);
				setUser(null);
			}
		} catch (error) {
			console.error('AuthContext: Error refreshing session:', error);
			// Don't clear user/session here to prevent flickering if it's just a temporary error
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
				// Check if we're within the cooldown period
				const now = Date.now();
				if (now - lastRefreshTime.current < refreshCooldown) {
					console.log('AuthContext: Skipping visibility refresh - within cooldown period');
					return;
				}

				console.log('AuthContext: Refreshing session due to visibility change');
				refreshSession();
			}
		};

		// Add visibility change listener with a debounce
		let visibilityTimeout: NodeJS.Timeout;
		const debouncedVisibilityHandler = () => {
			clearTimeout(visibilityTimeout);
			visibilityTimeout = setTimeout(handleVisibilityChange, 3000); // Increase to 3 seconds
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
