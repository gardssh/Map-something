'use client';
import { Layers, Footprints, Bike, Waves, Snowflake, CircleHelp, MapPin, Route, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createPortal } from 'react-dom';
import { ActivityCategory } from '@/lib/categories';

interface LayerOption {
	id: string;
	name: string;
	isBase?: boolean;
	icon?: JSX.Element;
	group?: string;
}

interface LayersControlProps {
	layers: LayerOption[];
	currentBaseLayer: string;
	overlayStates: Record<string, boolean>;
	onLayerToggle: (layerId: string, isVisible: boolean) => void;
	selectedCategories: ActivityCategory[];
	onCategoryToggle: (categories: ActivityCategory[]) => void;
	waypointsVisible: boolean;
	routesVisible: boolean;
	onWaypointsToggle: (visible: boolean) => void;
	onRoutesToggle: (visible: boolean) => void;
	dntCabinsVisible: boolean;
	onDNTCabinsToggle: (visible: boolean) => void;
}

const defaultLayers: LayerOption[] = [
	{ id: 'default', name: 'Outdoors', isBase: true },
	{ id: 'satellite', name: 'Satellite', isBase: true },
	{ id: 'norge-topo', name: 'Norge Topo', isBase: true },
	{ id: 'norge-flyfoto', name: 'Norge Flyfoto', isBase: true },
	{ id: 'bratthet', name: 'Bratthet' },
	{ id: 'snoskred', name: 'Snøskred' },
	{ id: 'custom-tileset', name: 'Heatmap 2000m Norge' },
];

export const LayersControl = ({
	layers = defaultLayers,
	currentBaseLayer,
	overlayStates,
	onLayerToggle,
	selectedCategories,
	onCategoryToggle,
	waypointsVisible = true,
	routesVisible = true,
	onWaypointsToggle,
	onRoutesToggle,
	dntCabinsVisible = true,
	onDNTCabinsToggle,
}: LayersControlProps) => {
	const baseLayers = layers?.filter((l) => l.isBase) || [];
	const overlayLayers = layers?.filter((l) => !l.isBase) || [];
	const [isOpen, setIsOpen] = useState(false);
	const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
		'Local Maps': true, // Default expanded state for Local Maps
	});

	// Group base layers
	const groupedBaseLayers = baseLayers.reduce(
		(acc, layer) => {
			if (layer.group) {
				if (!acc[layer.group]) {
					acc[layer.group] = [];
				}
				acc[layer.group].push(layer);
			} else {
				if (!acc['ungrouped']) {
					acc['ungrouped'] = [];
				}
				acc['ungrouped'].push(layer);
			}
			return acc;
		},
		{} as Record<string, LayerOption[]>
	);

	useEffect(() => {
		const container = document.createElement('div');
		container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		const controlGroup = document.querySelector('.mapboxgl-ctrl-top-right');
		if (controlGroup) {
			controlGroup.appendChild(container);

			// Add button to container
			const button = document.createElement('button');
			button.className = 'w-[29px] h-[29px] p-0 flex items-center justify-center bg-white cursor-pointer border-none';
			button.innerHTML = `
				<div class="flex items-center justify-center w-full h-full">
					<svg 
						width="18" 
						height="18" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2" 
						stroke-linecap="round" 
						stroke-linejoin="round"
						class="flex-shrink-0"
					>
						<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
						<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
						<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
					</svg>
				</div>
			`;

			const handleClick = () => {
				setButtonRect(button.getBoundingClientRect());
				setIsOpen((prev) => !prev);
			};

			button.addEventListener('click', handleClick);
			container.appendChild(button);

			return () => {
				button.removeEventListener('click', handleClick);
				controlGroup.removeChild(container);
			};
		}
	}, []);

	const sportCategories = [
		{ id: 'Foot Sports', name: 'Foot Sports', icon: <Footprints className="h-4 w-4 mr-2" /> },
		{ id: 'Cycle Sports', name: 'Cycle Sports', icon: <Bike className="h-4 w-4 mr-2" /> },
		{ id: 'Water Sports', name: 'Water Sports', icon: <Waves className="h-4 w-4 mr-2" /> },
		{ id: 'Winter Sports', name: 'Winter Sports', icon: <Snowflake className="h-4 w-4 mr-2" /> },
		{ id: 'Other Sports', name: 'Other Sports', icon: <CircleHelp className="h-4 w-4 mr-2" /> },
	];

	const allSportsSelected = sportCategories.every((category) =>
		selectedCategories.includes(category.name as ActivityCategory)
	);

	const handleToggleAllSports = () => {
		if (allSportsSelected) {
			onCategoryToggle([]);
		} else {
			onCategoryToggle(sportCategories.map((cat) => cat.name as ActivityCategory));
		}
	};

	return (
		<>
			{isOpen && buttonRect && (
				<>
					{/* Add overlay */}
					<div className="fixed inset-0 z-[10998]" onClick={() => setIsOpen(false)} />
					<div
						className="fixed bg-white rounded-md shadow-lg p-4 min-w-[200px] z-[10999] max-h-[calc(100vh-env(safe-area-inset-bottom,0px)-5rem)] overflow-y-auto"
						style={{
							right: window.innerWidth - buttonRect.left + 5,
							top: buttonRect.top,
							bottom: 'calc(5rem + env(safe-area-inset-bottom,0px))',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Base Maps */}
						<div className="mb-6">
							<div className="text-sm font-semibold text-gray-500 mb-3">Base Maps</div>
							<div className="flex flex-col space-y-2">
								{/* Render ungrouped base layers first */}
								{groupedBaseLayers['ungrouped']?.map((layer) => (
									<label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											name="baseLayer"
											checked={currentBaseLayer === layer.id}
											onChange={() => onLayerToggle(layer.id, true)}
											className="form-radio h-4 w-4 text-blue-600"
										/>
										<span className="text-sm text-gray-700">{layer.name}</span>
									</label>
								))}

								{/* Render grouped base layers */}
								{Object.entries(groupedBaseLayers).map(([groupName, groupLayers]) => {
									if (groupName === 'ungrouped') return null;
									return (
										<div key={groupName} className="ml-0">
											<button
												onClick={() => setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))}
												className="flex items-center space-x-2 w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded px-1"
											>
												<svg
													className={`h-4 w-4 transform transition-transform ${expandedGroups[groupName] ? 'rotate-90' : ''}`}
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M7.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z"
														clipRule="evenodd"
													/>
												</svg>
												<span className="font-medium">{groupName}</span>
											</button>
											{expandedGroups[groupName] && (
												<div className="ml-6 mt-1 space-y-1">
													{groupLayers.map((layer) => (
														<label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
															<input
																type="radio"
																name="baseLayer"
																checked={currentBaseLayer === layer.id}
																onChange={() => onLayerToggle(layer.id, true)}
																className="form-radio h-4 w-4 text-blue-600"
															/>
															<span className="text-sm text-gray-700">{layer.name}</span>
														</label>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{/* Overlays */}
						<div className="mb-6">
							<div className="text-sm font-semibold text-gray-500 mb-3">Overlays</div>
							<div className="flex flex-col space-y-2">
								{overlayLayers.map((layer) => (
									<label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
										<input
											type="checkbox"
											checked={overlayStates[layer.id]}
											onChange={() => onLayerToggle(layer.id, !overlayStates[layer.id])}
											className="form-checkbox h-4 w-4 text-blue-600"
										/>
										<span className="text-sm text-gray-700">{layer.name}</span>
									</label>
								))}
							</div>
						</div>

						{/* Features */}
						<div className="mb-6">
							<div className="text-sm font-semibold text-gray-500 mb-3">Features</div>
							<div className="flex flex-col space-y-2">
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={waypointsVisible}
										onChange={(e) => onWaypointsToggle?.(e.target.checked)}
										className="form-checkbox h-4 w-4 text-blue-600"
									/>
									<span className="text-sm text-gray-700 flex items-center">
										<MapPin className="h-4 w-4 mr-2" />
										Waypoints
									</span>
								</label>
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={routesVisible}
										onChange={(e) => onRoutesToggle?.(e.target.checked)}
										className="form-checkbox h-4 w-4 text-blue-600"
									/>
									<span className="text-sm text-gray-700 flex items-center">
										<Route className="h-4 w-4 mr-2" />
										Routes
									</span>
								</label>
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={dntCabinsVisible}
										onChange={(e) => onDNTCabinsToggle?.(e.target.checked)}
										className="form-checkbox h-4 w-4 text-blue-600"
									/>
									<span className="text-sm text-gray-700 flex items-center">
										<Home className="h-4 w-4 mr-2" />
										DNT Cabins
									</span>
								</label>
							</div>
						</div>

						{/* Sport Types */}
						<div>
							<div className="text-sm font-semibold text-gray-500 mb-3">Sport Types</div>
							<div className="flex flex-col space-y-2">
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={allSportsSelected}
										onChange={handleToggleAllSports}
										className="form-checkbox h-4 w-4 text-blue-600"
									/>
									<span className="text-sm text-gray-700 font-medium">Toggle All Sports</span>
								</label>
								{sportCategories.map((category) => (
									<label key={category.id} className="flex items-center space-x-2 cursor-pointer ml-2">
										<input
											type="checkbox"
											checked={selectedCategories.includes(category.name as ActivityCategory)}
											onChange={() => {
												const newCategories = selectedCategories.includes(category.name as ActivityCategory)
													? selectedCategories.filter((cat) => cat !== category.name)
													: [...selectedCategories, category.name as ActivityCategory];
												onCategoryToggle(newCategories);
											}}
											className="form-checkbox h-4 w-4 text-blue-600"
										/>
										<span className="text-sm text-gray-700 flex items-center">
											{category.icon}
											{category.name}
										</span>
									</label>
								))}
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
};
