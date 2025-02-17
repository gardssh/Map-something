import React, { useState, useEffect } from 'react';
import { useActivityRecording } from '@/hooks/useActivityRecording';
import { processRecordedActivity, saveActivity } from '@/services/activity';
import { toast } from 'sonner';
import { Layer, Source, useMap } from 'react-map-gl';
import { RecordControl } from '../MapComponent/controls/RecordControl';
import { RecordingInfo } from './RecordingInfo';
import * as turf from '@turf/turf';
import type { DrawnRoute } from '@/types/route';

interface ActivityRecorderProps {
	onRouteSave?: (route: DrawnRoute) => void;
	userId: string;
}

export const ActivityRecorder: React.FC<ActivityRecorderProps> = ({ onRouteSave, userId }) => {
	const { current: map } = useMap();
	const [isMapReady, setIsMapReady] = useState(false);
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
		error,
	} = useActivityRecording();

	const [activityName, setActivityName] = useState('');
	const [activityType, setActivityType] = useState('Run');
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [isExpanded, setIsExpanded] = useState(true);

	// Check if map is ready
	useEffect(() => {
		if (map && !isMapReady) {
			setIsMapReady(true);
		}
	}, [map, isMapReady]);

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
			// Save as activity
			const activity = processRecordedActivity(
				positions,
				distance,
				elapsedTime,
				averageSpeed,
				activityName || 'Recorded Activity',
				activityType
			);

			await saveActivity(activity);

			// Save as route
			if (onRouteSave) {
				const route: DrawnRoute = {
					id: `record-${Date.now()}`,
					name: activityName || 'Recorded Activity',
					user_id: userId,
					geometry: {
						type: 'LineString',
						coordinates: positions.map((pos) => [pos.longitude, pos.latitude]),
					},
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					comments: null,
					distance: turf.length(turf.lineString(positions.map((pos) => [pos.longitude, pos.latitude])), {
						units: 'kilometers',
					}),
					source: 'record',
				};

				await onRouteSave(route);
			}

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

	// Create GeoJSON for the recorded path only if we have positions and map is ready
	const pathGeoJSON =
		isMapReady && positions.length > 0
			? {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: positions.map((pos) => [pos.longitude, pos.latitude]),
					},
				}
			: null;

	// Only render the Source and Layer components when map and data are ready
	const renderPath = isMapReady && pathGeoJSON && (
		<Source type="geojson" data={pathGeoJSON}>
			<Layer
				id="recording-path"
				type="line"
				paint={{
					'line-color': '#FF0000',
					'line-width': 4,
					'line-opacity': 0.8,
				}}
			/>
			<Layer
				id="recording-points"
				type="circle"
				paint={{
					'circle-radius': 4,
					'circle-color': '#FF0000',
				}}
			/>
		</Source>
	);

	return (
		<>
			{/* Map overlay for the recorded path */}
			{renderPath}

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
