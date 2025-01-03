'use client';

import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useEffect } from 'react';

interface HelpButtonProps {
	activeItem?: string;
}

export default function HelpButton({ activeItem }: HelpButtonProps) {
	const { isMobile } = useResponsiveLayout();

	useEffect(() => {
		if (activeItem === 'profile') return;

		let container: HTMLDivElement | null = null;
		let button: HTMLButtonElement | null = null;

		const initializeButton = () => {
			// Remove existing container if it exists
			const existingContainer = document.querySelector('.help-button-container');
			if (existingContainer) {
				existingContainer.remove();
			}

			container = document.createElement('div');
			container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group help-button-container';

			button = document.createElement('button');
			button.className = 'w-[29px] h-[29px] p-0 flex items-center justify-center bg-white cursor-pointer border-none';
			button.title = 'Help';
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
						<circle cx="12" cy="12" r="10"/>
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
				</div>
			`;

			button.addEventListener('click', () => {
				const content = document.getElementById('help-content');
				if (content) {
					content.style.display = content.style.display === 'none' ? 'block' : 'none';
				}
			});

			container.appendChild(button);

			// Wait for the control group to be available
			const tryAddingControl = () => {
				const controlGroup = document.querySelector('.mapboxgl-ctrl-top-right');
				if (controlGroup && container) {
					controlGroup.appendChild(container);
				} else {
					setTimeout(tryAddingControl, 100);
				}
			};

			tryAddingControl();
		};

		// Initialize button
		initializeButton();

		// Cleanup
		return () => {
			if (container) {
				const controlGroup = document.querySelector('.mapboxgl-ctrl-top-right');
				if (controlGroup && controlGroup.contains(container)) {
					controlGroup.removeChild(container);
				}
			}
		};
	}, [activeItem]);

	if (activeItem === 'profile') return null;

	return (
		<div
			id="help-content"
			style={{ display: 'none' }}
			className={`fixed z-50 bg-white rounded-lg shadow-lg w-[80vw] md:w-[686px] p-6 space-y-6 ${
				isMobile ? 'top-32 right-[46px]' : 'top-4 right-[46px]'
			}`}
		>
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Hjelp</h2>
				<button
					id="help-close-button"
					className="p-1 hover:bg-gray-100 rounded-full"
					onClick={() => {
						const content = document.getElementById('help-content');
						if (content) {
							content.style.display = 'none';
						}
					}}
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<p className="text-sm">
				Først, hyggelig du er innom. Dette er et prosjekt i støpeskjeen, så det kan derfor dukke opp ulike bugs. Her har
				du et kart som har fokus på Norge.
				<br />
				<br />
				<strong>Layers</strong>
				<br />
				Du kan velge mellom en del ulike kartlag både for Norge og verden.
				<br />
				<br />
				<strong>Overlays</strong>
				<br />
				Det er overlays for snøskredutløp, bratthet og heatmap for populære ruter til Norges 2000m topper.
				<br />
				<br />
				<strong>Meny</strong>
				<br />
				Aktiviteter: Dett er aktivitetene (mine for nå, funksjonalitet for dine egne kommer snart)
				<br />
				Ruter: Dette er ruter du lager ved å trykke på rutelageren øverst til høyre. Når du ikke ønsker å følge en sti,
				må du holde nede shift.
				<br />
				Waypoints: Punkter du har lagt til. Høyreklikk på kartet for å legge til et.
			</p>

			<p className="text-sm italic">
				<strong>PS1: </strong>{' '}
				<a href="mailto:d48bwgqhrv@privaterelay.appleid.com" className="underline">
					Send meg gjerne en mail
				</a>{' '}
				om du finner noe feil, eller ønsker deg noe
			</p>

			<p className="text-sm italic">
				<strong>PS2:</strong> Det er ikke gratis å hverken drive eller bygge dette kartet.{' '}
				<a href="https://buymeacoffee.com/gardsh" target="_blank" rel="noopener noreferrer" className="underline">
					Kjøp meg gjerne en kaffe
				</a>{' '}
				så jeg kan holde det gående.
			</p>
		</div>
	);
}
