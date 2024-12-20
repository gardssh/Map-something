import Image from 'next/image';

export default function MobileNotice() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="relative w-24 h-24 rounded-xl overflow-hidden">
					<Image src="/favicon.svg" alt="Villspor Logo" fill className="object-contain" />
				</div>
				<h1 className="text-2xl font-semibold">Villspor</h1>
				<p className="text-muted-foreground max-w-sm">
					Mobile version coming soon! Please use a desktop browser to access all features.
				</p>
			</div>
		</div>
	);
}
