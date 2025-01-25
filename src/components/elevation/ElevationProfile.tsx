'use client';

import { useEffect, useState } from 'react';
import { getElevationsFromTile, fixElevationErrors } from '@/services/elevation/mapbox';
import { decode } from '@mapbox/polyline';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ElevationProfileProps {
	polyline: string;
	height?: number;
	isLoading?: boolean;
}

interface Point {
	x: number;
	y: number;
}

function smoothElevations(elevations: number[], windowSize: number = 5): number[] {
	const smoothed = [...elevations];
	const halfWindow = Math.floor(windowSize / 2);

	for (let i = 0; i < elevations.length; i++) {
		let sum = 0;
		let count = 0;

		for (let j = Math.max(0, i - halfWindow); j < Math.min(elevations.length, i + halfWindow + 1); j++) {
			if (elevations[j] > 0) {
				// Only include valid elevation points
				sum += elevations[j];
				count++;
			}
		}

		if (count > 0) {
			smoothed[i] = sum / count;
		}
	}

	return smoothed;
}

export default function ElevationProfile({ polyline, height = 200, isLoading = false }: ElevationProfileProps) {
	const [pathData, setPathData] = useState<string>('');
	const [elevationRange, setElevationRange] = useState({ min: 0, max: 0 });
	const [distance, setDistance] = useState(0);
	const [width, setWidth] = useState(600);
	const [isLoadingData, setIsLoadingData] = useState(false);

	useEffect(() => {
		const updateWidth = () => {
			const container = document.querySelector('.elevation-container');
			if (container) {
				setWidth(container.clientWidth);
			}
		};

		updateWidth();
		window.addEventListener('resize', updateWidth);
		return () => window.removeEventListener('resize', updateWidth);
	}, []);

	useEffect(() => {
		setIsLoadingData(true);
		const fetchElevationData = async () => {
			if (!width) return;

			try {
				const route = decode(polyline).map(([lat, lng]) => [lng, lat] as [number, number]);
				const elevations = await getElevationsFromTile(route, 15);
				const fixedElevations = fixElevationErrors(elevations);

				// Apply smoothing multiple times for better results
				let smoothedElevations = smoothElevations(fixedElevations, 5);
				smoothedElevations = smoothElevations(smoothedElevations, 3); // Second pass with smaller window

				// Calculate total distance in kilometers
				let totalDistance = 0;
				for (let i = 1; i < route.length; i++) {
					const [lon1, lat1] = route[i - 1];
					const [lon2, lat2] = route[i];
					const R = 6371; // Earth's radius in km
					const dLat = ((lat2 - lat1) * Math.PI) / 180;
					const dLon = ((lon2 - lon1) * Math.PI) / 180;
					const a =
						Math.sin(dLat / 2) * Math.sin(dLat / 2) +
						Math.cos((lat1 * Math.PI) / 180) *
							Math.cos((lat2 * Math.PI) / 180) *
							Math.sin(dLon / 2) *
							Math.sin(dLon / 2);
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					totalDistance += R * c;
				}
				setDistance(totalDistance);

				const minElevation = Math.min(...smoothedElevations);
				const maxElevation = Math.max(...smoothedElevations);
				const elevationRange = maxElevation - minElevation;

				// Add 5% padding to elevation range
				const paddedMin = Math.max(0, minElevation - elevationRange * 0.05);
				const paddedMax = maxElevation + elevationRange * 0.02;
				setElevationRange({ min: paddedMin, max: paddedMax });

				const margin = { top: 20, right: 5, bottom: 30, left: 40 };
				const graphWidth = width - margin.left - margin.right;
				const graphHeight = height - margin.top - margin.bottom;

				const points: Point[] = smoothedElevations.map((elevation, i) => ({
					x: (i / (smoothedElevations.length - 1)) * graphWidth + margin.left,
					y: graphHeight - ((elevation - paddedMin) / (paddedMax - paddedMin)) * graphHeight + margin.top,
				}));

				// Create path for line and fill
				const path = points.reduce(
					(acc, point, i) => acc + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`),
					''
				);

				// Add fill path by extending to bottom and back
				const fillPath = `${path} L ${width - margin.right},${height - margin.bottom} L ${margin.left},${height - margin.bottom} Z`;

				setPathData(fillPath);
			} catch (error) {
				console.error('Error fetching elevation data:', error);
			} finally {
				setIsLoadingData(false);
			}
		};

		if (polyline) {
			fetchElevationData();
		}
	}, [polyline, width, height]);

	// Generate intermediate elevation labels
	const generateElevationLabels = () => {
		const elevDiff = elevationRange.max - elevationRange.min;
		// Always show 4 intermediate labels for consistency with activity view
		const count = 4;
		const labels = [];
		const step = (elevationRange.max - elevationRange.min) / (count + 1);
		const graphHeight = height - 50;

		for (let i = 1; i <= count; i++) {
			const elevation = elevationRange.min + step * i;
			const y = graphHeight - graphHeight * (i / (count + 1)) + 20;
			labels.push(
				<text key={i} x="30" y={y} fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="end">
					{Math.round(elevation)}m
				</text>
			);
			// Add grid line with lighter color and no dash
			labels.push(<line key={`line-${i}`} x1="40" y1={y} x2={width - 5} y2={y} stroke="#e5e7eb" strokeWidth="1" />);
		}
		return labels;
	};

	// Generate distance labels
	const generateDistanceLabels = () => {
		// Always show 3 intermediate labels for consistency
		const count = 3;
		const labels = [];
		const step = distance / (count + 1);
		const graphWidth = width - 45;

		for (let i = 1; i <= count; i++) {
			const dist = step * i;
			const x = graphWidth * (i / (count + 1)) + 40;
			labels.push(
				<text key={i} x={x} y={height - 10} fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="middle">
					{dist.toFixed(1)}
				</text>
			);
			// Add grid line with lighter color and no dash
			labels.push(<line key={`line-${i}`} x1={x} y1="20" x2={x} y2={height - 30} stroke="#e5e7eb" strokeWidth="1" />);
		}
		return labels;
	};

	return (
		<Card className="p-4">
			{isLoading || isLoadingData ? (
				<div className="flex items-center justify-center" style={{ height }}>
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<div className="elevation-container w-full">
					<svg width={width} height={height} style={{ display: 'block' }}>
						{/* Background */}
						<rect width={width} height={height} fill="white" />

						{/* Grid lines - removed dash pattern */}
						<line x1="40" y1={height - 30} x2={width - 5} y2={height - 30} stroke="#e5e7eb" strokeWidth="1" />
						<line x1="40" y1="20" x2="40" y2={height - 30} stroke="#e5e7eb" strokeWidth="1" />

						{/* Additional grid lines and labels */}
						{generateElevationLabels()}
						{generateDistanceLabels()}

						{/* Elevation path with fill */}
						<path d={pathData} fill="rgb(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth="2" />

						{/* Y-axis labels */}
						<text x="30" y="30" fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="end">
							{Math.round(elevationRange.max)}m
						</text>
						<text x="30" y={height - 35} fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="end">
							{Math.round(elevationRange.min)}m
						</text>

						{/* X-axis labels */}
						<text x="40" y={height - 10} fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="start">
							0 km
						</text>
						<text x={width - 5} y={height - 10} fontSize="10" fill="#666" dominantBaseline="middle" textAnchor="end">
							{distance.toFixed(1)} km
						</text>
					</svg>
				</div>
			)}
		</Card>
	);
}
