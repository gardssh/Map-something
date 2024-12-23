import React from 'react';

interface DesktopLayoutProps {
	children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
	return (
		<div className="min-h-screen">
			{/* Your existing desktop layout */}
			{children}
		</div>
	);
};
