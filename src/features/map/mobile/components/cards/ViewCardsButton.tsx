import { Eye } from 'lucide-react';
import { Button } from '@/features/shared/components/ui/button';

interface ViewCardsButtonProps {
	itemCount: number;
	onClick: () => void;
}

export function ViewCardsButton({ itemCount, onClick }: ViewCardsButtonProps) {
	if (itemCount === 0) return null;

	return (
		<div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-[20] flex justify-center">
			<Button variant="default" className="shadow-lg flex items-center gap-2" onClick={onClick}>
				<Eye className="h-4 w-4" />
				<span>See {itemCount} items in this area</span>
			</Button>
		</div>
	);
}
