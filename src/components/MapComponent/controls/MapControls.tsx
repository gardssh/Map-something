'use client';

import { GeolocateControl, NavigationControl } from 'react-map-gl';
import { LayersControl } from '../LayersControl';
import DrawControl from '../DrawControl';
import type { DrawnRoute } from '@/types/route';
import type { DbRoute } from '@/types/supabase';

interface MapControlsProps {
	layers: Array<{
		id: string;
		name: string;
		isBase: boolean;
	}>;
	currentBaseLayer: string;
	overlayStates: { [key: string]: boolean };
	onLayerToggle: (layerId: string, isVisible: boolean) => void;
	selectedCategories: string[];
	onCategoryToggle: (categories: string[]) => void;
	userId: string;
	onDrawCreate: (evt: { features: any[] }) => void;
	onDrawUpdate: (evt: { features: any[]; action: string }) => void;
	onDrawDelete: (evt: { features: any[] }) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	onRouteAdd: (route: DbRoute) => void;
	onModeChange: (evt: { mode: string }) => void;
}

const MapControls = ({
	layers,
	currentBaseLayer,
	overlayStates,
	onLayerToggle,
	selectedCategories,
	onCategoryToggle,
	userId,
	onDrawCreate,
	onDrawUpdate,
	onDrawDelete,
	onRouteSave,
	onRouteAdd,
	onModeChange,
}: MapControlsProps) => {
	return (
		<>
			<GeolocateControl position="top-right" />
			<NavigationControl position="top-right" visualizePitch={true} showZoom={true} showCompass={true} />
			<LayersControl
				layers={layers}
				currentBaseLayer={currentBaseLayer}
				overlayStates={overlayStates}
				onLayerToggle={onLayerToggle}
				selectedCategories={selectedCategories}
				onCategoryToggle={onCategoryToggle}
			/>
			<DrawControl
				position="top-right"
				displayControlsDefault={false}
				userId={userId}
				controls={{
					line_string: true,
				}}
				onCreate={onDrawCreate}
				onUpdate={onDrawUpdate}
				onDelete={onDrawDelete}
				onRouteSave={onRouteSave}
				onRouteAdd={onRouteAdd}
				onModeChange={onModeChange}
			/>
		</>
	);
};

export default MapControls;
