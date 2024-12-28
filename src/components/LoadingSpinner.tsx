interface LoadingSpinnerProps {
	message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
				<p>{message}</p>
			</div>
		</div>
	);
}
