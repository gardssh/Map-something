'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/shared/components/ui/card';
import { createClient } from '@/lib/supabase';
import type { DbProfile } from '@/types/supabase';
import { LogOut, Coffee } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/features/shared/components/ui/separator';

export function MobileProfile() {
	const { user, refreshSession, signOut } = useAuth();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const supabase = createClient();

	// Load initial values
	useEffect(() => {
		if (user?.user_metadata) {
			setFirstName(user.user_metadata.first_name || '');
			setLastName(user.user_metadata.last_name || '');
		}
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
		<div className="absolute inset-0 overflow-y-auto pb-24">
			<div className="container max-w-2xl mx-auto p-4">
				<h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

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

				<Separator className="my-8" />

				{/* Actions */}
				<div className="flex flex-col space-y-4 mb-4">
					<Link href="https://buymeacoffee.com/gardsh" target="_blank" rel="noopener noreferrer" className="w-full">
						<Button variant="outline" className="w-full justify-start">
							<Coffee className="mr-2 h-4 w-4" />
							Donate
						</Button>
					</Link>

					<Button variant="outline" className="w-full justify-start text-destructive" onClick={() => signOut()}>
						<LogOut className="mr-2 h-4 w-4" />
						Log out
					</Button>
				</div>
			</div>
		</div>
	);
}
