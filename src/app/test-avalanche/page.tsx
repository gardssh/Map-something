'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';

const AVALANCHE_PROBLEM_TYPES = {
	0: 'Ikke gitt',
	3: 'Nysnø (løssnøskred)',
	5: 'Våt snø (løssnøskred)',
	7: 'Nysnø (flakskred)',
	10: 'Fokksnø (flakskred)',
	30: 'Vedvarende svakt lag (flakskred)',
	45: 'Våt snø (flakskred)',
	50: 'Glideskred',
} as const;

const AVALANCHE_TYPES = {
	0: 'Ikke gitt',
	10: 'Flakskred',
	20: 'Løssnøskred',
} as const;

const AVALANCHE_EXT = {
	0: 'Ikke gitt',
	10: 'Tørre løssnøskred',
	15: 'Våte løssnøskred',
	20: 'Tørre flakskred',
	25: 'Våte flakskred',
	27: 'Glideskred',
	30: 'Sørpeskred',
	40: 'Skavl',
} as const;

const AVAL_CAUSE = {
	0: 'Ikke gitt',
	10: 'Nedføyket svakt lag med nysnø',
	11: 'Nedsnødd eller nedføyket overflaterim',
	13: 'Nedsnødd eller nedføyket kantkornet snø',
	14: 'Dårlig binding mellom glatt skare og overliggende snø',
	15: 'Dårlig binding mellom lag i fokksnøen',
	16: 'Kantkornet snø ved bakken',
	18: 'Kantkornet snø over skarelag',
	19: 'Kantkornet snø under skarelag',
	20: 'Vann ved bakken/smelting fra bakken',
	22: 'Opphopning av vann i/over lag i snødekket',
	24: 'Ubunden snø',
} as const;

const AVAL_PROPAGATION = {
	0: 'Ikke gitt',
	1: 'Få bratte heng',
	2: 'Noen bratte heng',
	3: 'Mange bratte heng',
} as const;

const DESTRUCTIVE_SIZE = {
	0: 'Ikke gitt',
	1: '1 - Små',
	2: '2 - Middels',
	3: '3 - Store',
	4: '4 - Svært store',
	5: '5 - Ekstremt store',
	9: 'Ukjent',
} as const;

interface AvalancheProblem {
	AvalancheType: string;
	AvalancheProblemId: number;
	ValidExpositions: string[] | string;
	ValidHeights: string[] | string;
	ExposedHeight: string;
	ExposedHeightFill: number;
	Probability: string;
	ProbabilityId: number;
	Destructive_size: string;
	DestructiveSizeId: number;
	AvalancheExtTID: number;
	AvalancheExtName: string;
	AvalCauseId: number;
	AvalCauseName: string;
	Comment?: string;
	AvalTriggerSimpleName?: string;
	AvalPropagationName?: string;
	AvalReleaseHeightName?: string;
	AvalancheProbabilityName?: string;
	DestructiveSizeName?: string;
	ExposedHeight1?: number;
	ExposedHeight2?: number;
	AvalancheProblemTypeId?: number;
	AvalancheTypeId?: number;
	AvalancheExtId?: number;
	DestructiveSizeExtId?: number;
	AvalPropagationId?: number;
}

interface AvalancheForecast {
	RegId: number;
	RegionId: number;
	RegionName: string;
	RegionTypeId: number;
	RegionTypeName: string;
	DangerLevel: string;
	ValidFrom: string;
	ValidTo: string;
	NextWarningTime: string;
	PublishTime: string;
	MainText: string;
	LangKey: number;
	AvalancheProblems: AvalancheProblem[];
	AvalancheDangerTID: number;
	UtmZone: number;
	UtmEast: number;
	UtmNorth: number;
}

function getDangerLevelColor(level: string) {
	switch (level) {
		case '5':
			return 'bg-red-600 text-white';
		case '4':
			return 'bg-orange-500';
		case '3':
			return 'bg-orange-300';
		case '2':
			return 'bg-yellow-300';
		case '1':
			return 'bg-green-300';
		default:
			return 'bg-gray-100';
	}
}

function formatExpositions(expositions: string | string[]): string {
	if (typeof expositions === 'string') {
		// Convert binary string to directions
		// Example: "11110001" means N, NE, E, SE are exposed (1's represent exposed directions)
		const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
		return expositions
			.split('')
			.map((bit, index) => (bit === '1' ? directions[index] : null))
			.filter((dir) => dir !== null)
			.join(', ');
	}
	return Array.isArray(expositions) ? expositions.join(', ') : '';
}

function getEnumValue(id: number | undefined, enumObj: Record<number, string>): string {
	if (id === undefined) return '';
	return enumObj[id] || `Unknown (${id})`;
}

function isWetSnowProblem(problem: AvalancheProblem): boolean {
	// Check if any of the problems are wet snow related
	return (
		[5, 45].includes(problem.AvalancheProblemTypeId || 0) || // Wet snow problems
		[15, 25, 30].includes(problem.AvalancheExtId || 0)
	); // Wet loose, wet slab, or slush flow
}

function getDangerLevelImagePath(forecast: AvalancheForecast): string {
	if (!forecast.DangerLevel || forecast.DangerLevel === '0') {
		return `/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-No-Rating-EAWS.png`;
	}

	// Check if we have any wet snow problems
	const hasWetSnowProblem =
		forecast.AvalancheProblems?.some(
			(problem) =>
				// Wet snow avalanche problems
				[5, 45].includes(problem.AvalancheProblemTypeId || 0) ||
				// Wet snow avalanche types
				[15, 25, 30].includes(problem.AvalancheExtId || 0)
		) || false;

	const baseDir = hasWetSnowProblem ? 'dangerLevelWet' : 'dangerLevelDry';
	const dangerLevel = ['4', '5'].includes(forecast.DangerLevel) ? '4-5' : forecast.DangerLevel;

	return `/avalanche/${baseDir}/Icon-Avalanche-Danger-Level-${hasWetSnowProblem ? 'Wet' : 'Dry'}-Snow-${dangerLevel}-EAWS.png`;
}

function getProblemImagePath(problemTypeId: number | undefined): string {
	if (!problemTypeId) return '';

	// Map the problem type IDs to their corresponding image names
	const problemTypeToImage: Record<number, string> = {
		3: 'New-Snow', // Nysnø (løssnøskred)
		5: 'Wet-Snow', // Våt snø (løssnøskred)
		7: 'New-Snow', // Nysnø (flakskred)
		10: 'Wind-Slab', // Fokksnø (flakskred)
		30: 'Persistent-Weak-Layer', // Vedvarende svakt lag
		45: 'Wet-Snow', // Våt snø (flakskred)
		50: 'Gliding-Snow', // Glideskred
	};

	const imageName = problemTypeToImage[problemTypeId] || 'Unknown';
	return `/avalanche/problems/Icon-Avalanche-Problem-${imageName}-EAWS.svg`;
}

export default function TestAvalanche() {
	const [forecasts, setForecasts] = useState<AvalancheForecast[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchForecast = useCallback(async () => {
		try {
			// Get the map instance from the window object
			const mapInstance = (window as any).mapInstance;
			if (!mapInstance) {
				console.log('Map instance not available');
				return;
			}

			const center = mapInstance.getCenter();
			console.log('Fetching forecast for center:', center);

			const response = await fetch(
				`/api/avalanche-by-coordinates?x=${center.lng.toFixed(6)}&y=${center.lat.toFixed(6)}`
			);
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch forecast');
			}

			console.log('API Response:', result);
			const forecastData = Array.isArray(result.data) ? result.data : [result.data];
			console.log('Processed forecast data:', forecastData);

			if (forecastData.length === 0) {
				setError('No forecast available for this location');
				setForecasts([]);
				return;
			}

			setForecasts(forecastData);
			setError(null);
		} catch (err) {
			console.error('Error fetching forecast:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
			setForecasts([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Initial fetch
		fetchForecast();

		// Add listener for map movements
		const mapInstance = (window as any).mapInstance;
		if (mapInstance) {
			mapInstance.on('moveend', fetchForecast);
		}

		// Cleanup
		return () => {
			if (mapInstance) {
				mapInstance.off('moveend', fetchForecast);
			}
		};
	}, [fetchForecast]);

	if (loading) {
		return <div className="p-4">Loading...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">Error: {error}</div>;
	}

	if (!forecasts.length) {
		return <div className="p-4">No forecast data available for this location</div>;
	}

	// Get today's and tomorrow's dates at midnight
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const dayAfterTomorrow = new Date(tomorrow);
	dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

	// Filter forecasts for today and tomorrow
	const relevantForecasts = forecasts
		.filter((forecast) => {
			if (!forecast || !forecast.ValidFrom) return false;
			const forecastDate = new Date(forecast.ValidFrom);
			forecastDate.setHours(0, 0, 0, 0);
			return forecastDate >= today && forecastDate < dayAfterTomorrow;
		})
		.sort((a, b) => {
			if (!a.ValidFrom || !b.ValidFrom) return 0;
			return new Date(a.ValidFrom).getTime() - new Date(b.ValidFrom).getTime();
		});

	if (!relevantForecasts.length) {
		return <div className="p-4">No forecasts available for today or tomorrow at this location</div>;
	}

	return (
		<div className="space-y-4">
			{relevantForecasts.map((forecast) => (
				<div key={`${forecast.RegId}-${forecast.ValidFrom}`} className="space-y-4">
					{/* Danger Level Header Box */}
					<Card className="overflow-hidden">
						<div className={`p-4 ${getDangerLevelColor(forecast.DangerLevel)}`}>
							<div className="flex items-center gap-4">
								<img
									src={getDangerLevelImagePath(forecast)}
									alt={`Danger Level ${forecast.DangerLevel}`}
									className="w-16 h-16 object-contain"
									onError={(e) => {
										console.log(`Failed to load danger level image for level ${forecast.DangerLevel}`);
										e.currentTarget.style.display = 'none';
									}}
								/>
								<div>
									<h2 className="text-xl font-semibold">{forecast.RegionName}</h2>
									<p className="text-lg">Danger Level: {forecast.DangerLevel}</p>
								</div>
							</div>
						</div>
					</Card>

					{/* Main Content */}
					<div className="space-y-4 px-4">
						<div>
							<h3 className="font-semibold">Valid Period</h3>
							<p>From: {new Date(forecast.ValidFrom).toLocaleString()}</p>
							<p>To: {new Date(forecast.ValidTo).toLocaleString()}</p>
						</div>

						<div>
							<h3 className="font-semibold">Main Warning</h3>
							<p>{forecast.MainText}</p>
						</div>

						{/* Avalanche Problems in Gray Box */}
						{forecast.AvalancheProblems && forecast.AvalancheProblems.length > 0 && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold mb-3">Avalanche Problems</h3>
								<div className="space-y-4">
									{forecast.AvalancheProblems.map((problem, index) => (
										<div key={index} className="border-t first:border-t-0 pt-4 first:pt-0">
											<div className="flex flex-col space-y-2">
												<div className="flex items-center gap-4">
													<img
														src={getProblemImagePath(problem.AvalancheProblemTypeId)}
														alt={getEnumValue(problem.AvalancheProblemTypeId, AVALANCHE_PROBLEM_TYPES)}
														className="w-12 h-12 object-contain"
														onError={(e) => {
															console.log(`Failed to load problem image for type ${problem.AvalancheProblemTypeId}`);
															e.currentTarget.style.display = 'none';
														}}
													/>
													<div>
														<p className="font-medium text-lg">{problem.AvalancheType}</p>
														<div className="text-sm text-gray-600">
															<p>Type: {getEnumValue(problem.AvalancheProblemTypeId, AVALANCHE_PROBLEM_TYPES)}</p>
															<p>Category: {getEnumValue(problem.AvalancheTypeId, AVALANCHE_TYPES)}</p>
															<p>Classification: {getEnumValue(problem.AvalancheExtId, AVALANCHE_EXT)}</p>
														</div>
													</div>
												</div>

												<div className="space-y-4 mt-2">
													<div>
														<h4 className="font-medium mb-1">Characteristics</h4>
														<div className="text-sm space-y-1">
															<p>Probability: {problem.AvalancheProbabilityName || problem.Probability}</p>
															<p>
																Size:{' '}
																{problem.DestructiveSizeName ||
																	getEnumValue(problem.DestructiveSizeExtId, DESTRUCTIVE_SIZE)}
															</p>
															<p>Cause: {problem.AvalCauseName || getEnumValue(problem.AvalCauseId, AVAL_CAUSE)}</p>
															<p>
																Propagation:{' '}
																{problem.AvalPropagationName ||
																	getEnumValue(problem.AvalPropagationId, AVAL_PROPAGATION)}
															</p>
															{problem.Comment && <p className="text-gray-700">Comment: {problem.Comment}</p>}
														</div>
													</div>

													<div>
														<h4 className="font-medium mb-1">Location</h4>
														<div className="text-sm space-y-1">
															<p>Directions: {formatExpositions(problem.ValidExpositions)}</p>
															{problem.ExposedHeight1 !== undefined && problem.ExposedHeight2 !== undefined && (
																<p>
																	Elevation: {problem.ExposedHeight1}m - {problem.ExposedHeight2}m
																</p>
															)}
															{problem.ExposedHeight && <p>Height Range: {problem.ExposedHeight}</p>}
														</div>
													</div>
												</div>

												<div className="text-sm space-y-1 mt-2">
													{problem.AvalTriggerSimpleName && <p>Trigger Sensitivity: {problem.AvalTriggerSimpleName}</p>}
													{problem.AvalReleaseHeightName && <p>Release Height: {problem.AvalReleaseHeightName}</p>}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="text-sm text-gray-500">
							<p>Published: {new Date(forecast.PublishTime).toLocaleString()}</p>
							<p>Next warning: {new Date(forecast.NextWarningTime).toLocaleString()}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
