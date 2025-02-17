import React, { useState } from 'react';
import { useActivityRecording } from '@/hooks/useActivityRecording';
import { processRecordedActivity, saveActivity } from '@/services/activity';
import { toast } from 'sonner';
import { Layer, Source } from 'react-map-gl';
import { RecordControl } from '../MapComponent/controls/RecordControl';
import { RecordingInfo } from './RecordingInfo';

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
		error
	} = useActivityRecording();

	const [activityName, setActivityName] = useState('');
	const [activityType, setActivityType] = useState('Run');
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [isExpanded, setIsExpanded] = useState(true);

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

	const handleRecordToggle = async () => {
		if (isRecording) {
			handleStopRecording();
		} else {
			try {
				await startRecording();
				if (error) {
					toast.error(error);
				}
			} catch (err) {
				toast.error('Failed to start recording');
				console.error('Error starting recording:', err);
			}
		}
	};

	// Create GeoJSON for the recorded path only if we have positions
	const pathGeoJSON = positions.length > 0 ? {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: positions.map((pos) => [pos.longitude, pos.latitude]),
		},
	} : null;

	return (
		<>
			{/* Map overlay for the recorded path */}
			{pathGeoJSON && (
				<Source type="geojson" data={pathGeoJSON}>
					<Layer
						id="recording-path"
						type="line"
						paint={{
							'line-color': '#FF0000',
							'line-width': 3,
							'line-opacity': 0.8,
						}}
					/>
				</Source>
			)}

			{/* Recording button */}
			<RecordControl isRecording={isRecording} onClick={handleRecordToggle} />

			{/* Recording info panel */}
			{(isRecording || showSaveDialog) && (
				<RecordingInfo
					isRecording={isRecording}
					elapsedTime={elapsedTime}
					distance={distance}
					currentSpeed={currentSpeed}
					averageSpeed={averageSpeed}
					showSaveDialog={showSaveDialog}
					activityName={activityName}
					activityType={activityType}
					isExpanded={isExpanded}
					onActivityNameChange={setActivityName}
					onActivityTypeChange={setActivityType}
					onSave={handleSaveActivity}
					onDiscard={() => {
						setShowSaveDialog(false);
						resetRecording();
					}}
					onToggleExpand={() => setIsExpanded(!isExpanded)}
				/>
			)}
		</>
	);
};
