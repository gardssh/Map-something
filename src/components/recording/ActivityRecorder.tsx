import React, { useState } from 'react';
import { useActivityRecording } from '@/hooks/useActivityRecording';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { processRecordedActivity, saveActivity } from '@/services/activity';
import { toast } from 'sonner';

export const ActivityRecorder: React.FC = () => {
	const {
		isRecording,
		currentPosition,
		elapsedTime,
		distance,
		averageSpeed,
		currentSpeed,
		positions,
		startRecording,
		stopRecording,
		resetRecording,
	} = useActivityRecording();

	const [activityName, setActivityName] = useState('');
	const [activityType, setActivityType] = useState('Run');
	const [showSaveDialog, setShowSaveDialog] = useState(false);

	const formatTime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);
		return `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const formatDistance = (meters: number): string => {
		return (meters / 1000).toFixed(2) + ' km';
	};

	const formatSpeed = (mps: number): string => {
		// Convert m/s to km/h
		const kmh = (mps * 3.6).toFixed(1);
		return `${kmh} km/h`;
	};

	const handleStopRecording = () => {
		stopRecording();
		setShowSaveDialog(true);
	};

	const handleSaveActivity = async () => {
		if (positions.length === 0) {
			toast.error('No activity data to save');
			return;
		}

		try {
			const activity = processRecordedActivity(
				positions,
				distance,
				elapsedTime,
				averageSpeed,
				activityName || 'Recorded Activity',
				activityType
			);

			await saveActivity(activity);
			toast.success('Activity saved successfully');
			resetRecording();
			setShowSaveDialog(false);
			setActivityName('');
		} catch (error) {
			toast.error('Failed to save activity');
			console.error('Error saving activity:', error);
		}
	};

	return (
		<Card className="p-4 m-4">
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="text-center">
						<div className="text-sm text-gray-500">Time</div>
						<div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
					</div>
					<div className="text-center">
						<div className="text-sm text-gray-500">Distance</div>
						<div className="text-xl font-bold">{formatDistance(distance)}</div>
					</div>
					<div className="text-center">
						<div className="text-sm text-gray-500">Current Speed</div>
						<div className="text-xl font-bold">{currentSpeed ? formatSpeed(currentSpeed) : '-- km/h'}</div>
					</div>
					<div className="text-center">
						<div className="text-sm text-gray-500">Average Speed</div>
						<div className="text-xl font-bold">{formatSpeed(averageSpeed)}</div>
					</div>
				</div>

				{currentPosition && (
					<div className="grid grid-cols-2 gap-4 mt-4">
						<div className="text-center">
							<div className="text-sm text-gray-500">Latitude</div>
							<div className="text-sm">{currentPosition.latitude.toFixed(6)}</div>
						</div>
						<div className="text-center">
							<div className="text-sm text-gray-500">Longitude</div>
							<div className="text-sm">{currentPosition.longitude.toFixed(6)}</div>
						</div>
						{currentPosition.altitude && (
							<div className="text-center col-span-2">
								<div className="text-sm text-gray-500">Altitude</div>
								<div className="text-sm">{currentPosition.altitude.toFixed(1)}m</div>
							</div>
						)}
					</div>
				)}

				{showSaveDialog ? (
					<div className="space-y-4">
						<Input
							type="text"
							placeholder="Activity Name"
							value={activityName}
							onChange={(e) => setActivityName(e.target.value)}
							className="w-full"
						/>
						<select
							value={activityType}
							onChange={(e) => setActivityType(e.target.value)}
							className="w-full p-2 border rounded-md"
						>
							<option value="Run">Run</option>
							<option value="Ride">Ride</option>
							<option value="Walk">Walk</option>
							<option value="Hike">Hike</option>
						</select>
						<div className="flex justify-center space-x-4">
							<Button onClick={handleSaveActivity} className="bg-green-600 hover:bg-green-700">
								Save Activity
							</Button>
							<Button
								onClick={() => {
									setShowSaveDialog(false);
									resetRecording();
								}}
								variant="outline"
								className="border-gray-300"
							>
								Discard
							</Button>
						</div>
					</div>
				) : (
					<div className="flex justify-center space-x-4 mt-4">
						{!isRecording ? (
							<>
								<Button onClick={startRecording} className="bg-green-600 hover:bg-green-700">
									Start Recording
								</Button>
								<Button onClick={resetRecording} variant="outline" className="border-gray-300">
									Reset
								</Button>
							</>
						) : (
							<Button onClick={handleStopRecording} className="bg-red-600 hover:bg-red-700">
								Stop Recording
							</Button>
						)}
					</div>
				)}
			</div>
		</Card>
	);
};
