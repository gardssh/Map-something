'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

export default function HelpButton() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="mapboxgl-ctrl mapboxgl-ctrl-group"
					style={{ position: 'absolute', bottom: '50px', right: '10px', width: '29px', height: '29px' }}
				>
					<QuestionMarkCircledIcon className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[686px] p-6 space-y-6" side="left" align="end">
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
					<strong>PS2:</strong> Det er ikke gratis å hverken drive eller bygge dette kartet. {' '}
					<a href="https://buymeacoffee.com/gardsh" target="_blank" rel="noopener noreferrer" className="underline">
						Kjøp meg gjerne en kaffe
					</a>{' '}
					så jeg kan holde det gående.
				</p>
			</PopoverContent>
		</Popover>
	);
}
