'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}

const DRAWER_FULL_HEIGHT = 'calc(100vh - 4rem)';

export const MobileDrawer = ({ isOpen, onClose, children, title }: MobileDrawerProps) => {
	const controls = useAnimation();
	const y = useMotionValue(0);
	const [drawerState, setDrawerState] = useState<'closed' | 'full'>('closed');

	// Calculate background opacity based on drawer position
	const bgOpacity = useTransform(y, [0, window.innerHeight], [0.5, 0]);

	useEffect(() => {
		if (isOpen && drawerState === 'closed') {
			setDrawerState('full');
			controls.start({ y: 0 });
		} else if (!isOpen && drawerState !== 'closed') {
			setDrawerState('closed');
			controls.start({ y: window.innerHeight });
		}
	}, [isOpen, controls, drawerState]);

	const handleDragEnd = (event: any, info: any) => {
		const velocity = info.velocity.y;
		const position = info.point.y;
		const threshold = window.innerHeight * 0.3;

		if (velocity > 500 || position > threshold) {
			// Close drawer
			setDrawerState('closed');
			onClose();
			controls.start({ y: window.innerHeight });
		} else {
			// Keep full
			setDrawerState('full');
			controls.start({ y: 0 });
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						className="fixed inset-0 bg-black pointer-events-none z-[40]"
						initial={{ opacity: 0 }}
						style={{ opacity: bgOpacity }}
						exit={{ opacity: 0 }}
					/>
					<motion.div
						className="fixed inset-0 pointer-events-none z-[40]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className="absolute bottom-0 left-0 right-0 bg-background pointer-events-auto rounded-t-xl overflow-hidden shadow-lg"
							style={{
								height: DRAWER_FULL_HEIGHT,
								y,
								touchAction: 'none',
							}}
							drag="y"
							dragConstraints={{ top: 0, bottom: window.innerHeight }}
							dragElastic={0.1}
							dragMomentum={false}
							onDragEnd={handleDragEnd}
							animate={controls}
							initial={{ y: window.innerHeight }}
							exit={{ y: window.innerHeight }}
							transition={{
								type: 'spring',
								damping: 30,
								stiffness: 200,
								mass: 0.5,
							}}
						>
							<div className="absolute inset-x-0 -top-8 h-8 bg-background" />
							<div className="p-4 border-b" onPointerDown={(e) => e.stopPropagation()}>
								<div className="w-12 h-1.5 bg-muted-foreground/20 mx-auto rounded-full mb-4 cursor-grab active:cursor-grabbing" />
								<div className="flex justify-between items-center">
									<h2 className="text-lg font-semibold">{title}</h2>
									<button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
										<ChevronDown className="w-6 h-6" />
									</button>
								</div>
							</div>
							<motion.div
								className="overflow-auto"
								style={{
									height: `calc(${DRAWER_FULL_HEIGHT} - 5rem)`,
									overscrollBehavior: 'contain',
									touchAction: 'pan-y',
								}}
								onPointerDown={(e) => e.stopPropagation()}
							>
								<div className="p-4">{children}</div>
							</motion.div>
						</motion.div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};
