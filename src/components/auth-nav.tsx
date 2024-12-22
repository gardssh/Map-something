import Image from 'next/image';
import Link from 'next/link';

export function AuthNav() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-white/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
							<div className="relative w-8 h-8 overflow-hidden rounded-lg">
								<Image src="/favicon.svg" alt="Villspor Logo" fill className="object-cover" />
							</div>
							<span className="text-xl font-semibold text-white">Villspor</span>
						</Link>
					</div>

					{/* Space for future menu items */}
					<div className="flex items-center gap-4">{/* Menu items will go here */}</div>
				</div>
			</div>
		</nav>
	);
}
