'use client';

import { GeolocateControl, NavigationControl } from 'react-map-gl';
import { LayersControl } from '../LayersControl';
import DrawControl from './DrawControl';
import { ViewModeControl } from './ViewModeControl';
import type { DrawnRoute } from '@/types/route';
import type { DbRoute } from '@/types/supabase';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import HelpButton from '@/components/HelpButton';

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
	is3DMode: boolean;
	onViewModeToggle: () => void;
	waypointsVisible?: boolean;
	routesVisible?: boolean;
	onWaypointsToggle?: (visible: boolean) => void;
	onRoutesToggle?: (visible: boolean) => void;
	dntCabinsVisible?: boolean;
	onDNTCabinsToggle?: (visible: boolean) => void;
	activeItem?: string;
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
	is3DMode,
	onViewModeToggle,
	waypointsVisible,
	routesVisible,
	onWaypointsToggle,
	onRoutesToggle,
	dntCabinsVisible,
	onDNTCabinsToggle,
	activeItem,
}: MapControlsProps) => {
	const { isMobile } = useResponsiveLayout();

	return (
		<div className="absolute top-4 right-4 flex flex-col gap-2">
			<GeolocateControl position="top-right" />
			<NavigationControl position="top-right" visualizePitch={is3DMode} showZoom={true} showCompass={true} />
			<LayersControl
				layers={layers}
				currentBaseLayer={currentBaseLayer}
				overlayStates={overlayStates}
				onLayerToggle={onLayerToggle}
				selectedCategories={selectedCategories}
				onCategoryToggle={onCategoryToggle}
				waypointsVisible={waypointsVisible}
				routesVisible={routesVisible}
				onWaypointsToggle={onWaypointsToggle}
				onRoutesToggle={onRoutesToggle}
				dntCabinsVisible={dntCabinsVisible}
				onDNTCabinsToggle={onDNTCabinsToggle}
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
			<ViewModeControl is3DMode={is3DMode} onToggle={onViewModeToggle} />
			<HelpButton activeItem={activeItem} />
		</div>
	);
};

export default MapControls;
