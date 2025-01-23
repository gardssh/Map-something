'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MapRef } from 'react-map-gl';
import { v4 as uuidv4 } from 'uuid';

interface SearchResult {
	id: string;
	name: string;
	place_formatted: string;
	coordinates: [number, number];
}

interface SearchBoxProps {
	mapRef: React.RefObject<MapRef>;
}

export function SearchBox({ mapRef }: SearchBoxProps) {
	const [query, setQuery] = useState('');
	const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const sessionToken = useRef(uuidv4());
	const searchContainerRef = useRef<HTMLDivElement>(null);

	const handleSearch = useCallback(async (searchQuery: string) => {
		if (!searchQuery) {
			setSuggestions([]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchQuery)}&language=no&country=NO&types=poi,address,place&session_token=${sessionToken.current}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`
			);
			const data = await response.json();

			const formattedSuggestions =
				data.suggestions?.map((suggestion: any) => ({
					id: suggestion.mapbox_id,
					name: suggestion.name,
					place_formatted: suggestion.full_address || suggestion.place_formatted,
					coordinates: [0, 0], // We'll get the coordinates from the retrieve call
				})) || [];

			setSuggestions(formattedSuggestions);
			setShowSuggestions(true);
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleResultSelect = useCallback(
		async (suggestion: SearchResult) => {
			if (!mapRef.current) return;

			try {
				const response = await fetch(
					`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.id}?session_token=${sessionToken.current}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`
				);
				const data = await response.json();

				if (data.features?.[0]) {
					const feature = data.features[0];
					const coordinates = feature.geometry.coordinates;
					if (coordinates) {
						mapRef.current.flyTo({
							center: coordinates,
							zoom: 14,
							essential: true,
						});
					}
				}
			} catch (error) {
				console.error('Error retrieving result:', error);
			}

			setQuery(suggestion.place_formatted);
			setSuggestions([]);
			setShowSuggestions(false);
			// Generate a new session token after a successful search
			sessionToken.current = uuidv4();
		},
		[mapRef]
	);

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={searchContainerRef} className="absolute top-4 left-4 z-20 w-72">
			<div className="relative">
				<Input
					type="text"
					placeholder="Search locations..."
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						handleSearch(e.target.value);
					}}
					className="pr-10 bg-white/90 backdrop-blur-sm"
				/>
				<Button
					size="icon"
					variant="ghost"
					className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
					disabled={isLoading}
				>
					<Search className="h-4 w-4" />
				</Button>
			</div>

			{showSuggestions && suggestions.length > 0 && (
				<div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
					{suggestions.map((suggestion) => (
						<button
							key={suggestion.id}
							className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
							onClick={() => handleResultSelect(suggestion)}
						>
							<div className="font-medium">{suggestion.name}</div>
							<div className="text-sm text-gray-500">{suggestion.place_formatted}</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
