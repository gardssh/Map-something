'use client';
// Noe fix
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AuthNav } from '@/components/Auth/auth-nav';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const supabase = createClient();

	const handleSignIn = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
			window.location.href = '/';
		} catch (error: any) {
			setMessage(error.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
			style={{ backgroundImage: "url('/IMG_9790.jpeg')" }}
		>
			<div className="absolute inset-0 bg-black/40" />
			<AuthNav />

			<div className="relative z-10 flex flex-col items-center">
				<Card className="w-full max-w-[400px] mx-4">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
						<CardDescription>Log in and start exploring</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
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

						<Button className="w-full" onClick={handleSignIn} disabled={loading}>
							{loading ? 'Signing in...' : 'Log in'}
						</Button>

						{message && <p className="text-sm text-red-500 mt-2">{message}</p>}
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
							Forgot your password?
						</Link>

						<div className="text-sm text-center">
							Don&apos;t have an account?{' '}
							<Link href="/signup" className="text-primary hover:underline">
								Sign up for free
							</Link>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
