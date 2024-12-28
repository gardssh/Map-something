'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/ui/card';
import Link from 'next/link';
import { AuthNav } from '@/features/shared/components/auth/auth-nav';

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const supabase = createClient();

	const handleResetPassword = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/callback`,
			});

			if (error) throw error;
			setMessage('Check your email for the password reset link!');
		} catch (error: any) {
			setMessage(error.message || 'An error occurred');
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
						<CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
						<CardDescription>Enter your email to receive a password reset link</CardDescription>
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

						<Button className="w-full" onClick={handleResetPassword} disabled={loading}>
							{loading ? 'Sending link...' : 'Send reset link'}
						</Button>

						{message && (
							<p className={`text-sm ${message.includes('Check your email') ? 'text-green-500' : 'text-red-500'} mt-2`}>
								{message}
							</p>
						)}
					</CardContent>

					<CardFooter>
						<div className="text-sm text-center w-full">
							Remember your password?{' '}
							<Link href="/login" className="text-primary hover:underline">
								Back to login
							</Link>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
