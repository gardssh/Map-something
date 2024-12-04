'use client';
import { Layers, Footprints, Bike, Waves, Snowflake, CircleHelp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LayerOption {
	id: string;
	name: string;
	isBase?: boolean;
	icon?: JSX.Element;
}

interface LayersControlProps {
	layers: LayerOption[];
	activeLayers: string[];
	onLayerToggle: (layerId: string, isVisible: boolean) => void;
	selectedCategories: string[];
	onCategoryToggle: (categories: string[]) => void;
}

export const LayersControl = ({ 
	layers, 
	activeLayers, 
	onLayerToggle,
	selectedCategories,
	onCategoryToggle 
}: LayersControlProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
	const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

	const baseLayers = layers.filter(l => l.isBase);
	const overlays = layers.filter(l => !l.isBase);

	useEffect(() => {
		const container = document.createElement('div');
		document.body.appendChild(container);
		setPortalContainer(container);
		return () => {
			document.body.removeChild(container);
		};
	}, []);

	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setButtonRect(rect);
		setIsOpen(!isOpen);
	};

	const sportCategories = [
		{ id: 'Foot Sports', name: 'Foot Sports', icon: <Footprints className="h-4 w-4 mr-2" /> },
		{ id: 'Cycle Sports', name: 'Cycle Sports', icon: <Bike className="h-4 w-4 mr-2" /> },
		{ id: 'Water Sports', name: 'Water Sports', icon: <Waves className="h-4 w-4 mr-2" /> },
		{ id: 'Winter Sports', name: 'Winter Sports', icon: <Snowflake className="h-4 w-4 mr-2" /> },
		{ id: 'Other Sports', name: 'Other Sports', icon: <CircleHelp className="h-4 w-4 mr-2" /> },
	];

	return (
		<div className="absolute bottom-[165px] right-[10px]">
			<button
				onClick={handleButtonClick}
				className="mapboxgl-ctrl mapboxgl-ctrl-group"
				
				style={{
					width: '29px',
					height: '29px',
					marginBottom: '8px',
				}}
			>
				<div className="w-full h-full flex items-center justify-center">
					<Layers className="h-[18px] w-[18px]" />
				</div>
			</button>

			{isOpen && portalContainer && buttonRect && createPortal(
				<div 
					className="fixed bg-white rounded-md shadow-lg p-4 min-w-[200px]"
					style={{
						right: window.innerWidth - buttonRect.left + 8,
						bottom: window.innerHeight - buttonRect.bottom,
						transform: 'translateY(0)',
						zIndex: 9999,
					}}
				>
					{/* Base Maps */}
					<div className="mb-6">
						<div className="text-sm font-semibold text-gray-500 mb-3">Base Maps</div>
						<div className="flex flex-col space-y-2">
							{baseLayers.map(layer => (
								<label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
									<input
										type="radio"
										name="baseLayer"
										checked={activeLayers.includes(layer.id)}
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
							{overlays.map(layer => (
								<label key={layer.id} className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={activeLayers.includes(layer.id)}
										onChange={() => onLayerToggle(layer.id, !activeLayers.includes(layer.id))}
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
							{sportCategories.map(category => (
								<label key={category.id} className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={selectedCategories.includes(category.id)}
										onChange={() => {
											const newCategories = selectedCategories.includes(category.id)
												? selectedCategories.filter(id => id !== category.id)
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
				</div>,
				portalContainer
			)}
		</div>
	);
};
