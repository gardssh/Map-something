'use client';

import { MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AddWaypointControlProps {
	isActive: boolean;
	onClick: () => void;
}

export const AddWaypointControl = ({ isActive, onClick }: AddWaypointControlProps) => {
	useEffect(() => {
		const container = document.createElement('div');
		container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		const controlGroup = document.querySelector('.mapboxgl-ctrl-top-right');
		if (controlGroup) {
			// Find the help button container if it exists
			const helpButton = controlGroup.querySelector('.help-button-container');

			// Insert the waypoint control before the help button
			if (helpButton) {
				controlGroup.insertBefore(container, helpButton);
			} else {
				controlGroup.appendChild(container);
			}

			// Add button to container
			const button = document.createElement('button');
			button.className = 'w-[29px] h-[29px] p-0 flex items-center justify-center bg-white cursor-pointer border-none';
			button.title = isActive ? 'Cancel adding waypoint' : 'Add waypoint';
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
						class="${isActive ? 'text-blue-600' : ''}"
					>
						<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
						<circle cx="12" cy="10" r="3"/>
					</svg>
				</div>
			`;

			button.addEventListener('click', onClick);
			container.appendChild(button);

			return () => {
				button.removeEventListener('click', onClick);
				if (controlGroup.contains(container)) {
					controlGroup.removeChild(container);
				}
			};
		}
	}, [onClick, isActive]);

	return null;
};
