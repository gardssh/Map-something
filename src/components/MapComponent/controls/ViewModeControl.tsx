import { useEffect } from 'react';

interface ViewModeControlProps {
	is3DMode: boolean;
	onToggle: () => void;
}

export const ViewModeControl = ({ is3DMode, onToggle }: ViewModeControlProps) => {
	useEffect(() => {
		const container = document.createElement('div');
		container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		const controlGroup = document.querySelector('.mapboxgl-ctrl-top-right');
		if (controlGroup) {
			controlGroup.appendChild(container);

			const button = document.createElement('button');
			button.className = 'mapbox-gl-draw_ctrl-draw-btn';
			button.style.cssText = 'background: white; color: black;';
			button.title = is3DMode ? 'Switch to 2D view' : 'Switch to 3D view';
			button.innerHTML = `
				<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
					<span style="font-size: 12px; font-weight: 500;">${is3DMode ? '2D' : '3D'}</span>
				</div>
			`;

			button.addEventListener('click', onToggle);
			container.appendChild(button);

			return () => {
				button.removeEventListener('click', onToggle);
				controlGroup.removeChild(container);
			};
		}
	}, [is3DMode, onToggle]);

	return null;
};
