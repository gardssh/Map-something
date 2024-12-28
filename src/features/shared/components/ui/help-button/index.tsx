'use client';

import { Button } from '@/features/shared/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useResponsiveLayout } from '@/features/shared/hooks/responsive/useResponsiveLayout';
import { Popover, PopoverContent, PopoverTrigger } from '@/features/shared/components/ui/popover';

interface HelpButtonProps {
	activeItem?: string;
}

export default function HelpButton({ activeItem }: HelpButtonProps) {
	const { isMobile } = useResponsiveLayout();

	// Hide the help button when the profile page is active
	if (activeItem === 'profile') return null;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={`fixed z-[4] bg-white hover:bg-accent border rounded-sm
						${
							isMobile
								? 'right-[10px] top-[280px] w-[29px] h-[29px]' // Align with mapbox controls
								: 'bottom-4 right-4 h-10 w-10'
						}`}
				>
					<HelpCircle className="h-4 w-4" />
					<span className="sr-only">Help</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className={`w-[80vw] md:w-[686px] p-6 space-y-6 ${isMobile ? 'ml-[-75vw]' : 'ml-4'}`}
				side={isMobile ? 'left' : 'left'}
				align="end"
				sideOffset={20}
			>
				<h2 className="text-xl font-semibold">Hjelp</h2>

				<p className="text-sm">
					Først, hyggelig du er innom. Dette er et prosjekt i støpeskjeen, så det kan derfor dukke opp ulike bugs. Her
					har du et kart som har fokus på Norge.
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
					Ruter: Dette er ruter du lager ved å trykke på rutelageren øverst til høyre. Når du ikke ønsker å følge en
					sti, må du holde nede shift.
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
			</PopoverContent>
		</Popover>
	);
}
