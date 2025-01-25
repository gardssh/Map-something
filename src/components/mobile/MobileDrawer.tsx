'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MobileDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}

const DRAWER_FULL_HEIGHT = 'calc(100vh - 4rem)';

export const MobileDrawer = ({ isOpen, onClose, children, title }: MobileDrawerProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const [drawerState, setDrawerState] = useState<'closed' | 'full'>('closed');
	const y = useMotionValue(window.innerHeight);
	const bgOpacity = useTransform(y, [0, window.innerHeight], [0.5, 0]);

	useEffect(() => {
		if (isOpen) {
			setDrawerState('full');
			y.set(0);
		} else {
			setDrawerState('closed');
			y.set(window.innerHeight);
		}
	}, [isOpen, y]);

	const handleDragEnd = (event: any, info: any) => {
		setIsDragging(false);
		const velocity = info.velocity.y;
		const position = info.point.y;
		const threshold = window.innerHeight * 0.3;

		if (velocity > 500 || position > threshold) {
			setDrawerState('closed');
			onClose();
		} else {
			setDrawerState('full');
			y.set(0);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						className="fixed inset-0 bg-black pointer-events-none z-[40]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						exit={{ opacity: 0 }}
					/>
					<div className="fixed inset-0 pointer-events-none z-[40]">
						<motion.div
							className="absolute bottom-0 left-0 right-0 bg-background pointer-events-auto rounded-t-xl overflow-hidden shadow-lg"
							style={{ height: DRAWER_FULL_HEIGHT, y }}
							initial={{ y: window.innerHeight }}
							animate={{ y: 0 }}
							exit={{ y: window.innerHeight }}
							transition={{
								type: 'spring',
								damping: 30,
								stiffness: 200,
							}}
						>
							<div className="absolute inset-x-0 -top-8 h-8 bg-background" />
							{/* Header with drag handle */}
							<motion.div
								className="p-4 border-b cursor-grab active:cursor-grabbing touch-none"
								drag="y"
								dragConstraints={{ top: 0, bottom: window.innerHeight }}
								dragElastic={0.1}
								dragMomentum={false}
								onDragStart={() => setIsDragging(true)}
								onDragEnd={handleDragEnd}
								onDrag={(e, info) => {
									y.set(Math.max(0, y.get() + info.delta.y));
								}}
							>
								<div className="w-12 h-1.5 bg-muted-foreground/20 mx-auto rounded-full mb-4" />
								<div className="flex justify-between items-center">
									<h2 className="text-lg font-semibold">{title}</h2>
								</div>
							</motion.div>
							{/* Scrollable content */}
							<div
								className="overflow-auto overscroll-contain"
								style={{
									height: `calc(${DRAWER_FULL_HEIGHT} - 5rem)`,
									touchAction: 'pan-y',
									pointerEvents: isDragging ? 'none' : 'auto',
								}}
							>
								<div className="p-4">{children}</div>
							</div>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
};
