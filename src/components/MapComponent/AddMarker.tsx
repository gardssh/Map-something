import { switchCoordinates } from '../activities/switchCor';
import { Marker, Source, Layer } from 'react-map-gl';
import { getActivityColor } from '@/lib/utils';

export default function AddMarker({ activity }: any) {
	var coordinates = switchCoordinates(activity);
	var long;
	var lat;

	if (coordinates.length > 0) {
		long = coordinates[0][0];
		lat = coordinates[0][1];

		return <Marker longitude={long} latitude={lat}></Marker>;
	}
}
