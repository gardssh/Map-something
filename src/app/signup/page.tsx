'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AuthNav } from '@/components/auth-nav';

export default function SignUpPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
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

	return (
		<div
			className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
			style={{ backgroundImage: 'url(/IMG_9790.jpeg)' }}
		>
			<div className="absolute inset-0 bg-black/40" />
			<AuthNav />

			<div className="relative z-10 flex flex-col items-center">
				<Card className="w-[400px]">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">Create an account</CardTitle>
						<CardDescription>Sign up to start exploring</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Input
									type="text"
									placeholder="First name"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Input
									type="text"
									placeholder="Last name"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Input
								type="email"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>

						<Button className="w-full" onClick={handleSignUp} disabled={loading}>
							{loading ? 'Creating account...' : 'Sign up'}
						</Button>

						{message && (
							<p className={`text-sm ${message.includes('Check your email') ? 'text-green-500' : 'text-red-500'} mt-2`}>
								{message}
							</p>
						)}
					</CardContent>

					<CardFooter>
						<div className="text-sm text-center w-full">
							Already have an account?{' '}
							<Link href="/login" className="text-primary hover:underline">
								Log in
							</Link>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
