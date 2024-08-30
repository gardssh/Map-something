import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bike, CircleHelp, Footprints, Snowflake, Waves } from 'lucide-react';

export const CategoryFilter = ({
	selectedCategories,
	setSelectedCategories,
}: {
	selectedCategories: string[];
	setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
	const handleChange = (value: string[]) => {
		setSelectedCategories(value);
	};
	return (
		<div className="absolute top-4 right-4 rounded-sm">
			<ToggleGroup type="multiple" size="sm" value={selectedCategories} onValueChange={handleChange}>
				<ToggleGroupItem value="Foot Sports" className="bg-slate-300">
					<Footprints className="h-5 w-5 mr-2" />
					Foot Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Cycle Sports" className="bg-slate-300">
					<Bike className="h-5 w-5 mr-2" />
					Cycle Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Water Sports" className="bg-slate-300">
					<Waves className="h-5 w-5 mr-2" />
					Water Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Winter Sports" className="bg-slate-300">
					<Snowflake className="h-5 w-5 mr-2" />
					Winter Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Other Sports" className="bg-slate-300">
					<CircleHelp className="h-5 w-5 mr-2" />
					Other Sports
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
};
