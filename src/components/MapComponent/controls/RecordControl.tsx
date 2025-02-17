import { useEffect, useCallback } from 'react';

interface RecordControlProps {
	isRecording: boolean;
	onClick: () => void;
}

export const RecordControl = ({ isRecording, onClick }: RecordControlProps) => {
	const createControl = useCallback(() => {
		// Find or create the record control group
		let controlGroup = document.querySelector('.mapboxgl-ctrl-record-group');
		if (!controlGroup) {
			controlGroup = document.createElement('div');
			controlGroup.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-record-group';
		}

		// Create the button if it doesn't exist
		let button = controlGroup.querySelector('.mapboxgl-ctrl-record') as HTMLButtonElement;
		if (!button) {
			button = document.createElement('button');
			button.className = 'mapboxgl-ctrl-record';
			button.style.cssText = `
				width: 29px;
				height: 29px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: white;
				border: none;
				cursor: pointer;
				padding: 0;
				border-radius: 4px;
			`;
			controlGroup.appendChild(button);
		}

		// Update button appearance
		button.title = isRecording ? 'Stop Recording (Click to save or discard)' : 'Start Recording';
		const color = '#ef4444';
		button.innerHTML = isRecording
			? `<svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="none">
				 <rect x="6" y="6" width="12" height="12" rx="1"/>
			   </svg>`
			: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
				 <circle cx="12" cy="12" r="8"/>
			   </svg>`;

		const handleClick = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				onClick();
			} catch (error) {
				console.error('Error in record button click:', error);
			}
		};

		button.removeEventListener('click', handleClick);
		button.addEventListener('click', handleClick);

		return {
			controlGroup,
			button,
			handleClick,
		};
	}, [isRecording, onClick]);

	useEffect(() => {
		let cleanup: (() => void) | undefined;

		const addControl = () => {
			const topRightControls = document.querySelector('.mapboxgl-ctrl-top-right');
			if (!topRightControls) {
				setTimeout(addControl, 100);
				return;
			}

			const { controlGroup, button, handleClick } = createControl();

			// Ensure the control group is in the correct position (after navigation controls)
			const navigationControl = topRightControls.querySelector('.mapboxgl-ctrl-group');
			if (navigationControl && navigationControl.nextSibling) {
				topRightControls.insertBefore(controlGroup, navigationControl.nextSibling);
			} else {
				topRightControls.appendChild(controlGroup);
			}

			cleanup = () => {
				button.removeEventListener('click', handleClick);
				controlGroup.remove();
			};
		};

		addControl();

		return () => {
			if (cleanup) {
				cleanup();
			}
		};
	}, [createControl]);

	return null;
};
