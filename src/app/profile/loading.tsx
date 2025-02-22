export default function Loading() {
	return (
		<div className="container max-w-2xl mx-auto p-4 pt-20">
			<div className="animate-pulse">
				<div className="h-8 w-32 bg-gray-200 rounded mb-8"></div>

				{/* Profile Overview Skeleton */}
				<div className="mb-8 border rounded-lg p-6">
					<div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
					<div className="space-y-4">
						<div className="h-4 w-full bg-gray-200 rounded"></div>
						<div className="h-4 w-3/4 bg-gray-200 rounded"></div>
					</div>
				</div>

				{/* Personal Information Skeleton */}
				<div className="mb-8 border rounded-lg p-6">
					<div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
					<div className="space-y-4">
						<div className="h-10 w-full bg-gray-200 rounded"></div>
						<div className="h-10 w-full bg-gray-200 rounded"></div>
						<div className="h-10 w-32 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
