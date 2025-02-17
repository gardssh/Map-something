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

	const handleRecordToggle = () => {
		if (isRecording) {
			handleStopRecording();
		} else {
			startRecording();
		}
	};

	// Create GeoJSON for the recorded path
	const pathGeoJSON = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'LineString',
			coordinates: positions.map((pos) => [pos.longitude, pos.latitude]),
		},
	};

	return (
		<>
			{/* Map overlay for the recorded path */}
			{positions.length > 0 && (
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
