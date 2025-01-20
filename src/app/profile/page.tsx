'use client';

import { useState, useEffect } from 'react';
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

export default function ProfilePage() {
	const { user, refreshSession } = useAuth();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [stravaToken, setStravaToken] = useState<any>(null);
	const [activitiesCount, setActivitiesCount] = useState(0);
	const supabase = createClient();

	// Load initial values and data
	useEffect(() => {
		async function loadData() {
			if (user?.id) {
				// Load profile metadata
				if (user.user_metadata) {
					setFirstName(user.user_metadata.first_name || '');
					setLastName(user.user_metadata.last_name || '');
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

			// Force a session refresh to update the UI
			await refreshSession();

			// Update local state with new values
			if (updatedUser?.user_metadata) {
				setFirstName(updatedUser.user_metadata.first_name || '');
				setLastName(updatedUser.user_metadata.last_name || '');
			}

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
									<p className="text-sm">{user?.created_at && new Date(user.created_at).toLocaleDateString()}</p>
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

			{/* Message Display */}
			{message && (
				<p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
			)}
		</div>
	);
}
