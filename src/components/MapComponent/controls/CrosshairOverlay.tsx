import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CrosshairOverlayProps {
	onConfirm: () => void;
	onCancel: () => void;
}

export const CrosshairOverlay = ({ onConfirm, onCancel }: CrosshairOverlayProps) => {
	return (
		<div className="absolute inset-0 pointer-events-none">
			{/* Crosshair */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
				<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="20" cy="20" r="2" fill="currentColor" />
					<line x1="20" y1="8" x2="20" y2="16" stroke="currentColor" strokeWidth="2" />
					<line x1="20" y1="24" x2="20" y2="32" stroke="currentColor" strokeWidth="2" />
					<line x1="32" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="2" />
					<line x1="16" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="2" />
				</svg>
			</div>

			{/* Helper text */}
			<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full">
				Position the crosshair and confirm to add waypoint
			</div>

			{/* Control buttons */}
			<div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
				<Button variant="secondary" size="icon" onClick={onCancel}>
					<X className="h-4 w-4" />
				</Button>
				<Button onClick={onConfirm}>
					<Check className="h-4 w-4 mr-2" />
					Add Waypoint
				</Button>
			</div>
		</div>
	);
};
