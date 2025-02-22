'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase';
import type { DbProfile } from '@/types/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StravaConnectionStatus } from '@/features/strava-auth/components/StravaConnectionStatus';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function TokenHandler() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { refreshSession } = useAuth();
	const supabase = createClient();

	useEffect(() => {
		const token = searchParams.get('token');
		if (token) {
			const handleToken = async () => {
				try {
					const {
						data: { session },
						error,
					} = await supabase.auth.setSession({
						access_token: token,
						refresh_token: '',
					});

					if (error) {
						console.error('Error setting session:', error);
						router.push('/login');
						return;
					}

					// Remove token from URL but keep user on profile page
					const newUrl = new URL(window.location.href);
					newUrl.searchParams.delete('token');
					window.history.replaceState({}, '', newUrl);

					// Refresh the session to update the UI
					await refreshSession();
				} catch (error) {
					console.error('Error handling token:', error);
					router.push('/login');
				}
			};
			handleToken();
		}
	}, [searchParams]);

	return null;
}

function ProfileContent({ user }: { user: any }) {
	const { refreshSession, signOut } = useAuth();
	const router = useRouter();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [stravaToken, setStravaToken] = useState<any>(null);
	const [activitiesCount, setActivitiesCount] = useState(0);
	const [memberSince, setMemberSince] = useState<string | null>(null);
	const supabase = createClient();

	// Load initial values and data
	useEffect(() => {
		async function loadData() {
			if (user?.id) {
				// Load profile data including names and created_at
				const { data: profile } = await supabase
					.from('profiles')
					.select('first_name, last_name, created_at')
					.eq('id', user.id)
					.single();

				if (profile) {
					setFirstName(profile.first_name || '');
					setLastName(profile.last_name || '');
					if (profile.created_at) {
						setMemberSince(new Date(profile.created_at).toLocaleDateString());
					}
				}

				// Load Strava token
				const { data: token } = await supabase.from('strava_tokens').select('*').eq('user_id', user.id).single();
				setStravaToken(token);

				// Load activities count
				const { count } = await supabase
					.from('strava_activities')
					.select('*', { count: 'exact', head: true })
					.eq('user_id', user.id);
				setActivitiesCount(count || 0);
			}
		}
		loadData();
	}, [user]);

	const updateNames = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			setMessage('First name and last name are required');
			return;
		}

		if (!user?.id) {
			setMessage('User not authenticated');
			return;
		}

		try {
			setLoading(true);
			setMessage('');

			// Update auth metadata
			const {
				data: { user: updatedUser },
				error: authError,
			} = await supabase.auth.updateUser({
				data: {
					first_name: firstName,
					last_name: lastName,
					full_name: `${firstName} ${lastName}`,
				},
			});

			if (authError) throw authError;

			// Update profiles table
			const { error: profileError } = await supabase.from('profiles').upsert({
				id: user.id,
				first_name: firstName,
				last_name: lastName,
				updated_at: new Date().toISOString(),
			} satisfies DbProfile['Insert']);

			if (profileError) throw profileError;

			// Keep the current values in the input fields
			setFirstName(firstName);
			setLastName(lastName);

			// Force a session refresh to update the UI
			await refreshSession();

			setMessage('Names updated successfully!');
		} catch (error: any) {
			console.error('Error updating names:', error);
			setMessage(error.message || 'Error updating names');
		} finally {
			setLoading(false);
		}
	};

	const updatePassword = async () => {
		if (password !== confirmPassword) {
			setMessage('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			setMessage('Password must be at least 6 characters');
			return;
		}

		try {
			setLoading(true);
			setMessage('');

			const { error } = await supabase.auth.updateUser({
				password: password,
			});

			if (error) throw error;
			setMessage('Password updated successfully!');
			setPassword('');
			setConfirmPassword('');
		} catch (error: any) {
			setMessage(error.message || 'Error updating password');
		} finally {
			setLoading(false);
		}
	};

	const deleteAccount = async () => {
		if (!user?.id) return;

		try {
			setLoading(true);
			setMessage('');

			const response = await fetch('/api/user/delete', {
				method: 'DELETE',
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error deleting account');
			}

			// Sign out and redirect to home
			await signOut();
			router.push('/');
		} catch (error: any) {
			console.error('Error deleting account:', error);
			setMessage(error.message || 'Error deleting account');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container max-w-2xl mx-auto p-4 pt-20">
			<div className="mb-6">
				<Link href="/">
					<Button variant="ghost" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Back to Map
					</Button>
				</Link>
			</div>
			<h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

			{/* Profile Overview */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Profile Overview</CardTitle>
					<CardDescription>Your account information and statistics</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-medium">Email</h3>
							<p className="text-sm text-muted-foreground">{user?.email}</p>
						</div>
						<Separator className="my-4" />
						<div>
							<h3 className="text-sm font-medium">Account Statistics</h3>
							<div className="grid grid-cols-2 gap-4 mt-2">
								<div>
									<p className="text-sm text-muted-foreground">Member Since</p>
									<p className="text-sm">{memberSince || 'Loading...'}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Activities</p>
									<p className="text-sm">{activitiesCount}</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Name Settings */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>Update your name information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="firstName" className="text-sm font-medium">
							First Name
						</label>
						<Input
							id="firstName"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							placeholder="Enter your first name"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="lastName" className="text-sm font-medium">
							Last Name
						</label>
						<Input
							id="lastName"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							placeholder="Enter your last name"
							required
						/>
					</div>

					<Button onClick={updateNames} disabled={loading}>
						{loading ? 'Updating...' : 'Update Names'}
					</Button>
				</CardContent>
			</Card>

			{/* Strava Connection */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Strava Connection</CardTitle>
					<CardDescription>Connect your Strava account to sync activities</CardDescription>
				</CardHeader>
				<CardContent>
					<StravaConnectionStatus
						isConnected={!!stravaToken}
						athleteId={stravaToken?.strava_athlete_id}
						lastSync={stravaToken?.updated_at}
						onDisconnect={() => {
							setStravaToken(null);
							setActivitiesCount(0);
						}}
					/>
				</CardContent>
			</Card>

			{/* Password Settings */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>Change your password</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							New Password
						</label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter new password"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="confirmPassword" className="text-sm font-medium">
							Confirm New Password
						</label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm new password"
						/>
					</div>

					<Button onClick={updatePassword} disabled={loading}>
						{loading ? 'Updating...' : 'Update Password'}
					</Button>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="mb-8 border-red-200">
				<CardHeader>
					<CardTitle className="text-red-600">Danger Zone</CardTitle>
					<CardDescription>Irreversible actions for your account</CardDescription>
				</CardHeader>
				<CardContent>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive">Delete Account</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete your account and remove all your data from
									our servers.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
									{loading ? 'Deleting...' : 'Delete Account'}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>

			{/* Message Display */}
			{message && (
				<p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
			)}
		</div>
	);
}

export default function ClientProfile({ user }: { user: any }) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<TokenHandler />
			<ProfileContent user={user} />
		</Suspense>
	);
}
