import { switchCoordinates } from '../activities/switchCor';
import { Marker } from 'react-map-gl';
import { CirclePlay, CircleStop } from 'lucide-react';

export default function AddMarker({ activity }: any) {
	var coordinates = switchCoordinates(activity);
	var longStart;
	var latStart;

	var longEnd;
	var latEnd;

	if (coordinates.length > 0) {
		longStart = coordinates[0][0];
		latStart = coordinates[0][1];

		longEnd = coordinates[coordinates.length - 1][0];
		latEnd = coordinates[coordinates.length - 1][1];

		return (
			<>
				<Marker longitude={longStart} latitude={latStart}>
					<CirclePlay className="h-7 w-7 fill-green-400" />
				</Marker>

				<Marker longitude={longEnd} latitude={latEnd}>
					<CircleStop className="h-7 w-7 fill-orange-400" />
				</Marker>
			</>
		);
	}
	return <></>;
}
