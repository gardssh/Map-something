import { MapComponent } from '@/components/MapComponent';
import { MobileProfile } from '@/components/mobile/MobileProfile';
import { MobileDrawer } from '@/components/mobile/MobileDrawer';
import { ActivityDetails } from '@/components/details/ActivityDetails';
import { RouteDetails } from '@/components/details/RouteDetails';
import { WaypointDetails } from '@/components/details/WaypointDetails';
import type { Activity } from '@/types/activity';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import * as turf from '@turf/turf';
import { ActivityCategory } from '@/lib/categories';

interface MobileViewProps {
	isOnline: boolean;
	activeItem: string;
	activities: Activity[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	mapInstance: mapboxgl.Map | null;
	setMapInstance: (map: mapboxgl.Map) => void;
	handleActivitySelect: (activity: any | null) => void;
	selectedRoute: DbRoute | null;
	selectedWaypoint: DbWaypoint | null;
	routes: DbRoute[];
	handleRouteSelect: (route: DbRoute | null) => void;
	handleRouteDelete: (routeId: string) => void;
	handleRouteRename: (routeId: string, newName: string) => void;
	waypoints: DbWaypoint[];
	handleWaypointDelete: (waypointId: string) => void;
	handleWaypointRename: (waypointId: string, newName: string) => void;
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	setVisibleRoutesId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	setVisibleWaypointsId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	handleRouteSave: (route: DbRoute) => void;
	handleWaypointSave: (waypoint: DbWaypoint) => void;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	handleWaypointSelect: (waypoint: DbWaypoint | null) => void;
	onWaypointCommentUpdate: (waypointId: string, comments: string) => void;
	onRouteCommentUpdate: (routeId: string, comments: string) => void;
	setActiveItem: (item: string) => void;
	showDetailsDrawer: boolean;
	setShowDetailsDrawer: (show: boolean) => void;
	selectedActivity: any;
	setSelectedActivity: React.Dispatch<React.SetStateAction<any>>;
	setSelectedRoute: React.Dispatch<React.SetStateAction<DbRoute | null>>;
	setSelectedWaypoint: React.Dispatch<React.SetStateAction<DbWaypoint | null>>;
}

interface AvalancheProblem {
	AvalancheType: string;
	AvalancheProblemId: number;
	ValidExpositions: string[] | string;
	ValidHeights: string[] | string;
	ExposedHeight: string;
	ExposedHeightFill: number;
	Probability: string;
	ProbabilityId: number;
	Destructive_size: string;
	DestructiveSizeId: number;
	AvalancheExtTID: number;
	AvalancheExtName: string;
	AvalCauseId: number;
	AvalCauseName: string;
	Comment?: string;
	AvalTriggerSimpleName?: string;
	AvalPropagationName?: string;
	AvalReleaseHeightName?: string;
	AvalancheProbabilityName?: string;
	DestructiveSizeName?: string;
	ExposedHeight1?: number;
	ExposedHeight2?: number;
	AvalancheProblemTypeId?: number;
	AvalancheTypeId?: number;
	AvalancheExtId?: number;
	DestructiveSizeExtId?: number;
	AvalPropagationId?: number;
}

interface AvalancheForecast {
	RegId: number;
	RegionId: number;
	RegionName: string;
	RegionTypeId: number;
	RegionTypeName: string;
	DangerLevel: string;
	ValidFrom: string;
	ValidTo: string;
	NextWarningTime: string;
	PublishTime: string;
	MainText: string;
	LangKey: number;
	AvalancheProblems: AvalancheProblem[];
	AvalancheDangerTID: number;
	UtmZone: number;
	UtmEast: number;
	UtmNorth: number;
}

// Import helper functions from TestAvalanche
function getDangerLevelImagePath(forecast: AvalancheForecast): string {
	if (!forecast.DangerLevel || forecast.DangerLevel === '0') {
		return `/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-No-Rating-EAWS.png`;
	}

	const hasWetSnowProblem =
		forecast.AvalancheProblems?.some(
			(problem: any) =>
				[5, 45].includes(problem.AvalancheProblemTypeId || 0) || [15, 25, 30].includes(problem.AvalancheExtId || 0)
		) || false;

	const baseDir = hasWetSnowProblem ? 'dangerLevelWet' : 'dangerLevelDry';
	const dangerLevel = ['4', '5'].includes(forecast.DangerLevel) ? '4-5' : forecast.DangerLevel;

	return `/avalanche/${baseDir}/Icon-Avalanche-Danger-Level-${hasWetSnowProblem ? 'Wet' : 'Dry'}-Snow-${dangerLevel}-EAWS.png`;
}

function getProblemImagePath(problemTypeId: number | undefined): string {
	if (!problemTypeId) return '';

	const problemTypeToImage: Record<number, string> = {
		3: 'New-Snow',
		5: 'Wet-Snow',
		7: 'New-Snow',
		10: 'Wind-Slab',
		30: 'Persistent-Weak-Layer',
		45: 'Wet-Snow',
		50: 'Gliding-Snow',
	};

	const imageName = problemTypeToImage[problemTypeId] || 'Unknown';
	return `/avalanche/problems/Icon-Avalanche-Problem-${imageName}-EAWS.svg`;
}

function formatExpositions(validExpositions: string[] | string): string {
	if (!validExpositions) return 'Not specified';

	// If it's a binary string (e.g., "11110000")
	if (typeof validExpositions === 'string') {
		const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
		return validExpositions
			.split('')
			.map((bit, index) => (bit === '1' ? directions[index] : null))
			.filter(Boolean)
			.join(', ');
	}

	// If it's already an array of directions
	return Array.isArray(validExpositions) ? validExpositions.join(', ') : 'Not specified';
}

export function MobileView({
	isOnline,
	activeItem,
	activities,
	visibleActivitiesId,
	selectedRouteId,
	mapInstance,
	setMapInstance,
	handleActivitySelect,
	selectedRoute,
	selectedWaypoint,
	routes,
	handleRouteSelect,
	handleRouteDelete,
	handleRouteRename,
	waypoints,
	handleWaypointDelete,
	handleWaypointRename,
	setVisibleActivitiesId,
	setVisibleRoutesId,
	setVisibleWaypointsId,
	handleRouteSave,
	handleWaypointSave,
	setSelectedRouteId,
	handleWaypointSelect,
	onWaypointCommentUpdate,
	onRouteCommentUpdate,
	setActiveItem,
	showDetailsDrawer,
	setShowDetailsDrawer,
	selectedActivity,
	setSelectedActivity,
	setSelectedRoute,
	setSelectedWaypoint,
}: MobileViewProps) {
	const [forecasts, setForecasts] = useState<AvalancheForecast[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);

	const fetchForecast = async () => {
		try {
			const mapInstance = (window as any).mapInstance;
			if (!mapInstance) {
				console.log('Map instance not available');
				return;
			}

			const center = mapInstance.getCenter();
			const response = await fetch(
				`/api/avalanche-by-coordinates?x=${center.lng.toFixed(6)}&y=${center.lat.toFixed(6)}`
			);
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch forecast');
			}

			const forecastData = Array.isArray(result.data) ? result.data : [result.data];
			if (forecastData.length === 0) {
				setError('No forecast available for this location');
				setForecasts([]);
				return;
			}

			// Get today's and tomorrow's dates at midnight
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dayAfterTomorrow = new Date(tomorrow);
			dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

			// Filter forecasts for today and tomorrow
			const relevantForecasts = forecastData
				.filter((forecast: AvalancheForecast) => {
					if (!forecast || !forecast.ValidFrom) return false;
					const forecastDate = new Date(forecast.ValidFrom);
					forecastDate.setHours(0, 0, 0, 0);
					return forecastDate >= today && forecastDate < dayAfterTomorrow;
				})
				.sort((a: AvalancheForecast, b: AvalancheForecast) => {
					if (!a.ValidFrom || !b.ValidFrom) return 0;
					return new Date(a.ValidFrom).getTime() - new Date(b.ValidFrom).getTime();
				});

			setForecasts(relevantForecasts);
			setError(null);
		} catch (err) {
			console.error('Error fetching forecast:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
			setForecasts([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchIfAvalanche = () => {
			if (activeItem === 'avalanche') {
				fetchForecast();
			}
		};
		fetchIfAvalanche();
	}, [activeItem]);

	const calculateRouteDistance = (route: DbRoute) => {
		if (!route.geometry?.coordinates) return 0;
		const validCoords = route.geometry.coordinates.filter(
			(coord): coord is [number, number] => Array.isArray(coord) && coord.length === 2
		);
		return turf.length(turf.lineString(validCoords), { units: 'kilometers' });
	};

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col">
			{!isOnline && (
				<div className="bg-yellow-500 text-white px-4 py-2 text-sm">
					You&apos;re offline. Some features may be limited.
				</div>
			)}
			<div className="flex-1 relative">
				{activeItem === `profile` ? (
					<MobileProfile />
				) : (
					<>
						<MapComponent
							activities={activities}
							setVisibleActivitiesId={setVisibleActivitiesId}
							setVisibleRoutesId={setVisibleRoutesId}
							setVisibleWaypointsId={setVisibleWaypointsId}
							selectedRouteId={selectedRouteId}
							setSelectedRouteId={setSelectedRouteId}
							onMapLoad={(map) => setMapInstance(map)}
							onRouteSave={handleRouteSave}
							onRouteSelect={handleRouteSelect}
							onActivitySelect={handleActivitySelect}
							routes={routes}
							waypoints={waypoints}
							onWaypointSave={handleWaypointSave}
							handleWaypointSelect={handleWaypointSelect}
							selectedWaypoint={selectedWaypoint}
							setActiveItem={setActiveItem}
							setShowDetailsDrawer={setShowDetailsDrawer}
							activeItem={activeItem}
							selectedCategories={selectedCategories}
							setSelectedCategories={setSelectedCategories}
						/>
						<MobileDrawer
							isOpen={[`activities`, `routes`, `waypoints`, `avalanche`].includes(activeItem)}
							onClose={() => setActiveItem(`nearby`)}
							title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
						>
							{activeItem === `activities` && (
								<div className="space-y-4">
									{activities.map((activity) => (
										<div
											key={activity.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => handleActivitySelect(activity)}
										>
											<h3 className="font-medium">{activity.name}</h3>
											<p className="text-sm text-muted-foreground">
												{activity.start_date ? new Date(activity.start_date).toLocaleDateString() : ''}
											</p>
										</div>
									))}
								</div>
							)}
							{activeItem === `routes` && (
								<div className="space-y-4">
									{routes.map((route) => (
										<div
											key={route.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => {
												handleRouteSelect(route);
												setSelectedRoute(route);
												setSelectedRouteId(route.id);
												setShowDetailsDrawer(true);
											}}
										>
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-medium">{route.name}</h3>
													<p className="text-sm text-muted-foreground">
														Distance: {(route.distance || calculateRouteDistance(route)).toFixed(1)} km
													</p>
													{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
							{activeItem === `waypoints` && (
								<div className="space-y-4">
									{waypoints.map((waypoint) => (
										<div
											key={waypoint.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => {
												handleWaypointSelect(waypoint);
												setShowDetailsDrawer(true);
											}}
										>
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-medium">{waypoint.name}</h3>
													{waypoint.comments && <p className="text-sm text-muted-foreground">{waypoint.comments}</p>}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
							{activeItem === `avalanche` && (
								<div className="space-y-4">
									{loading ? (
										<div className="p-4">Loading...</div>
									) : error ? (
										<div className="p-4 text-red-500">Error: {error}</div>
									) : forecasts.length === 0 ? (
										<div className="p-4">No forecast available for this location</div>
									) : (
										forecasts.map((forecast) => (
											<div key={`${forecast.RegId}-${forecast.ValidFrom}`} className="p-4 border rounded-lg">
												<div className="flex flex-col gap-4">
													<div className="flex items-center justify-between border-b pb-4">
														<div>
															<h3 className="font-medium">{forecast.RegionName}</h3>
															<p className="text-sm text-muted-foreground">
																{new Date(forecast.ValidFrom).toLocaleDateString()} -{' '}
																{new Date(forecast.ValidTo).toLocaleDateString()}
															</p>
														</div>
														<Image
															src={getDangerLevelImagePath(forecast)}
															alt={`Danger Level ${forecast.DangerLevel}`}
															width={40}
															height={40}
															onError={(e) => {
																console.error('Error loading image:', e);
																e.currentTarget.style.display = 'none';
															}}
														/>
													</div>

													<div>
														<h3 className="font-medium mb-2">Main Warning</h3>
														<p className="text-sm">{forecast.MainText}</p>
													</div>
													{forecast.AvalancheProblems?.map((problem: any, index: number) => (
														<div key={index}>
															<h3 className="font-medium mb-2">Avalanche Problem {index + 1}</h3>
															<div className="bg-accent/50 rounded-lg p-4">
																<div className="flex items-center gap-4 mb-4">
																	<Image
																		src={getProblemImagePath(problem.AvalancheProblemTypeId)}
																		alt="Avalanche Problem"
																		width={40}
																		height={40}
																		onError={(e) => {
																			console.error('Error loading image:', e);
																			e.currentTarget.style.display = 'none';
																		}}
																	/>
																	<div>
																		<p className="font-medium">{problem.AvalancheType}</p>
																		<p className="text-sm text-muted-foreground">
																			{problem.AvalancheProbabilityName} probability, {problem.DestructiveSizeName}
																		</p>
																	</div>
																</div>
																<div className="space-y-4">
																	<div>
																		<p className="text-sm text-muted-foreground">Location</p>
																		<p>
																			{problem.ExposedHeight1 !== undefined && problem.ExposedHeight2 !== undefined
																				? `${problem.ExposedHeight1}m - ${problem.ExposedHeight2}m`
																				: problem.ExposedHeight}
																		</p>
																		<p className="text-sm text-muted-foreground mt-2">Directions</p>
																		<p>{formatExpositions(problem.ValidExpositions)}</p>
																	</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>
										))
									)}
								</div>
							)}
						</MobileDrawer>
						<MobileDrawer
							isOpen={showDetailsDrawer && (!!selectedActivity || !!selectedRoute || !!selectedWaypoint)}
							onClose={() => {
								setShowDetailsDrawer(false);
								setSelectedActivity(null);
								setSelectedRoute(null);
								setSelectedWaypoint(null);
								handleWaypointSelect?.(null);
								setSelectedRouteId(null);
							}}
							title={
								selectedActivity
									? 'Activity Details'
									: selectedRoute
										? 'Route Details'
										: selectedWaypoint
											? 'Waypoint Details'
											: ''
							}
						>
							{selectedActivity && <ActivityDetails activity={selectedActivity} />}
							{selectedRoute && (
								<RouteDetails
									route={selectedRoute}
									onDelete={handleRouteDelete}
									onEdit={(routeId, newName, newComment) => {
										handleRouteRename(routeId, newName);
										onRouteCommentUpdate(routeId, newComment);
									}}
									onClose={() => {
										setShowDetailsDrawer(false);
										setSelectedRoute(null);
										setSelectedRouteId(null);
									}}
								/>
							)}
							{selectedWaypoint && (
								<WaypointDetails
									waypoint={selectedWaypoint}
									onDelete={handleWaypointDelete}
									onEdit={(waypointId, newName, newComment) => {
										handleWaypointRename(waypointId, newName);
										onWaypointCommentUpdate(waypointId, newComment);
									}}
									onClose={() => {
										setShowDetailsDrawer(false);
										setSelectedWaypoint(null);
										handleWaypointSelect?.(null);
									}}
								/>
							)}
						</MobileDrawer>
					</>
				)}
			</div>
		</div>
	);
}
