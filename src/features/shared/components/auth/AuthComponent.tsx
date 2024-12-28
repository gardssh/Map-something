'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';

export default function AuthComponent() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);
	const supabase = createClient();

	const handleSignUp = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			setMessage('First name and last name are required');
			return;
		}

		try {
			setLoading(true);
			const { data: authData, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						first_name: firstName,
						last_name: lastName,
						full_name: `${firstName} ${lastName}`,
					},
					emailRedirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (signUpError) throw signUpError;
			setMessage('Check your email for the confirmation link!');
		} catch (error: any) {
			setMessage(error?.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	const handleSignIn = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
		} catch (error: any) {
			setMessage(error.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col space-y-4 max-w-md mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Welcome</h1>

			{isSignUp && (
				<>
					<Input
						type="text"
						placeholder="First Name"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
					/>

					<Input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
				</>
			)}

			<Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

			<Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

			<div className="flex space-x-4">
				<Button onClick={isSignUp ? handleSignUp : () => setIsSignUp(true)} disabled={loading} variant="outline">
					{isSignUp ? 'Sign Up' : 'Create Account'}
				</Button>

				{isSignUp ? (
					<Button onClick={() => setIsSignUp(false)} disabled={loading} variant="ghost">
						Back to Sign In
					</Button>
				) : (
					<Button onClick={handleSignIn} disabled={loading}>
						Sign In
					</Button>
				)}
			</div>

			{message && (
				<p
					className={`text-sm ${message.includes('error') || message.includes('required') ? 'text-red-500' : 'text-green-500'}`}
				>
					{message}
				</p>
			)}
		</div>
	);
}
