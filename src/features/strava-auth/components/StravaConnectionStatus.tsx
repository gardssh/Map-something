'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StravaConnectButton } from './StravaConnectButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface StravaConnectionStatusProps {
	isConnected: boolean;
	onDisconnect?: () => void;
	athleteId?: number;
	lastSync?: string;
}

function StravaConnectionStatusInner({ isConnected, onDisconnect, athleteId, lastSync }: StravaConnectionStatusProps) {
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const supabase = createClientComponentClient();

	useEffect(() => {
		const errorParam = searchParams.get('error');
		const successParam = searchParams.get('success');

		if (errorParam) {
			switch (errorParam) {
				case 'strava_account_already_connected':
					setError('This Strava account is already connected to another user.');
					break;
				case 'token_exchange':
					setError('Failed to connect to Strava. Please try again.');
					break;
				case 'not_authenticated':
					setError('You must be logged in to connect your Strava account.');
					break;
				default:
					setError('An error occurred while connecting to Strava.');
			}
		}

		if (successParam === 'connected') {
			setSuccess('Successfully connected to Strava!');
		}
	}, [searchParams]);

	const handleDisconnect = async () => {
		try {
			setLoading(true);
			setError(null);
			setSuccess(null);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				setError('You must be logged in to disconnect your Strava account.');
				return;
			}

			// Delete activities first
			const { error: activitiesError } = await supabase.from('strava_activities').delete().eq('user_id', user.id);

			if (activitiesError) throw activitiesError;

			// Then delete Strava tokens
			const { error } = await supabase.from('strava_tokens').delete().eq('user_id', user.id);

			if (error) throw error;

			setSuccess('Successfully disconnected from Strava!');
			if (onDisconnect) onDisconnect();
		} catch (error: any) {
			console.error('Error disconnecting from Strava:', error);
			setError(error.message || 'Failed to disconnect from Strava');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h2 className="text-xl font-semibold mb-4">Strava Connection</h2>

			{error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			{isConnected ? (
				<div className="space-y-4">
					<div className="text-green-600">✓ Connected to Strava</div>
					{athleteId && <p className="text-sm text-muted-foreground">Connected as athlete #{athleteId}</p>}
					{lastSync && (
						<p className="text-sm text-muted-foreground">Last synced: {new Date(lastSync).toLocaleString()}</p>
					)}
					<Button onClick={handleDisconnect} variant="destructive" disabled={loading}>
						{loading ? 'Disconnecting...' : 'Disconnect Strava'}
					</Button>
				</div>
			) : (
				<div>
					<p className="mb-4">Connect your Strava account to sync your activities</p>
					<StravaConnectButton />
				</div>
			)}
		</div>
	);
}

export function StravaConnectionStatus(props: StravaConnectionStatusProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<StravaConnectionStatusInner {...props} />
		</Suspense>
	);
}
