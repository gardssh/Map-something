import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen max-w-screen-sm mx-auto">
      {/* Mobile-optimized layout */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        {/* Mobile navigation */}
        <nav className="flex justify-around">
          {/* Add your navigation items here */}
        </nav>
      </div>
      <main className="pb-16">
        {children}
      </main>
    </div>
  );
}; 