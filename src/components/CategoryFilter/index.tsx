import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
				<ToggleGroupItem value="Foot Sports" className="bg-white">
					Foot Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Cycle Sports" className="bg-white">
					Cycle Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Water Sports" className="bg-white">
					Water Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Winter Sports" className="bg-white">
					Winter Sports
				</ToggleGroupItem>
				<ToggleGroupItem value="Other Sports" className="bg-white">
					Other Sports
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
};
