import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RecordingInfoProps {
	isRecording: boolean;
	elapsedTime: number;
	distance: number;
	currentSpeed: number | null;
	averageSpeed: number;
	showSaveDialog: boolean;
	activityName: string;
	activityType: string;
	isExpanded: boolean;
	onActivityNameChange: (name: string) => void;
	onActivityTypeChange: (type: string) => void;
	onSave: () => void;
	onDiscard: () => void;
	onToggleExpand: () => void;
}

export const RecordingInfo = ({
	isRecording,
	elapsedTime,
	distance,
	currentSpeed,
	averageSpeed,
	showSaveDialog,
	activityName,
	activityType,
	isExpanded,
	onActivityNameChange,
	onActivityTypeChange,
	onSave,
	onDiscard,
	onToggleExpand,
}: RecordingInfoProps) => {
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
		const kmh = (mps * 3.6).toFixed(1);
		return `${kmh} km/h`;
	};

	return (
		<div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
			<Card className="m-4 shadow-lg pointer-events-auto">
				<div className="p-4 cursor-pointer flex justify-between items-center" onClick={onToggleExpand}>
					<div className="flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
						<span className="font-medium">{isRecording ? 'Recording Activity...' : 'Activity Recording'}</span>
					</div>
					{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
				</div>

				{isExpanded && (
					<div className="px-4 pb-4 space-y-4">
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

						{showSaveDialog && (
							<div className="space-y-4">
								<Input
									type="text"
									placeholder="Activity Name"
									value={activityName}
									onChange={(e) => onActivityNameChange(e.target.value)}
									className="w-full"
								/>
								<select
									value={activityType}
									onChange={(e) => onActivityTypeChange(e.target.value)}
									className="w-full p-2 border rounded-md"
								>
									<option value="Run">Run</option>
									<option value="Ride">Ride</option>
									<option value="Walk">Walk</option>
									<option value="Hike">Hike</option>
								</select>
								<div className="flex justify-center space-x-4">
									<Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
										Save Activity
									</Button>
									<Button onClick={onDiscard} variant="outline" className="border-gray-300">
										Discard
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</Card>
		</div>
	);
};
