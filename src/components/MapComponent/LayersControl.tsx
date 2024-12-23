'use client';
import { Layers, Footprints, Bike, Waves, Snowflake, CircleHelp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createPortal } from 'react-dom';

interface LayerOption {
	id: string;
	name: string;
	isBase?: boolean;
	icon?: JSX.Element;
}

interface LayersControlProps {
	layers: LayerOption[];
	currentBaseLayer: string;
	overlayStates: { [key: string]: boolean };
	onLayerToggle: (layerId: string, isVisible: boolean) => void;
	selectedCategories: string[];
	onCategoryToggle: (categories: string[]) => void;
}

export const LayersControl = ({
	layers = [],
	currentBaseLayer,
	overlayStates,
	onLayerToggle,
	selectedCategories,
	onCategoryToggle,
}: LayersControlProps) => {
	const baseLayers = layers?.filter((l) => l.isBase) || [];
	const overlayLayers = layers?.filter((l) => !l.isBase) || [];
	const [isOpen, setIsOpen] = useState(false);
	const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

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

	return (
		<>
			{isOpen && buttonRect && (
				<div
					className="fixed bg-white rounded-md shadow-lg p-4 min-w-[200px]"
					style={{
						right: window.innerWidth - buttonRect.left + 5,
						top: buttonRect.top,
						zIndex: 9999,
					}}
				>
					{/* Base Maps */}
					<div className="mb-6">
						<div className="text-sm font-semibold text-gray-500 mb-3">Base Maps</div>
						<div className="flex flex-col space-y-2">
							{baseLayers.map((layer) => (
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

					{/* Sport Types */}
					<div>
						<div className="text-sm font-semibold text-gray-500 mb-3">Sport Types</div>
						<div className="flex flex-col space-y-2">
							{sportCategories.map((category) => (
								<label key={category.id} className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={selectedCategories.includes(category.id)}
										onChange={() => {
											const newCategories = selectedCategories.includes(category.id)
												? selectedCategories.filter((id) => id !== category.id)
												: [...selectedCategories, category.id];
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
			)}
		</>
	);
};
