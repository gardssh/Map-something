import { useEffect } from 'react';

interface RecordControlProps {
	isRecording: boolean;
	onClick: () => void;
}

export const RecordControl = ({ isRecording, onClick }: RecordControlProps) => {
	useEffect(() => {
		// Remove any existing record controls first
		const existingControls = document.querySelectorAll('.mapboxgl-ctrl-record-container');
		existingControls.forEach((control) => control.remove());

		const container = document.createElement('div');
		container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-record-container';
		const topRightControls = document.querySelector('.mapboxgl-ctrl-top-right');

		if (topRightControls) {
			// Always append to the end
			topRightControls.appendChild(container);

			// Create the button
			const button = document.createElement('button');
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
			button.title = isRecording ? 'Stop Recording (Click to save or discard)' : 'Start Recording';

			// Update button appearance based on recording state
			const updateButtonAppearance = () => {
				const color = isRecording ? '#ef4444' : '#ef4444';
				button.innerHTML = isRecording
					? `<svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="none">
						 <rect x="6" y="6" width="12" height="12" rx="1"/>
					   </svg>`
					: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
						 <circle cx="12" cy="12" r="8"/>
					   </svg>`;
			};

			updateButtonAppearance();

			const handleClick = (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				try {
					onClick();
				} catch (error) {
					console.error('Error in record button click:', error);
				}
			};

			button.addEventListener('click', handleClick);
			container.appendChild(button);

			return () => {
				button.removeEventListener('click', handleClick);
				container.remove();
			};
		}
	}, [isRecording, onClick]);

	return null;
};
