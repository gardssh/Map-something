'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
	peekContent?: React.ReactNode;
}

const DRAWER_PEEK_HEIGHT = 280; // Height of the peek view in pixels
const DRAWER_FULL_HEIGHT = 'calc(100vh - 4rem)';

export const MobileDrawer = ({ isOpen, onClose, children, title, peekContent }: MobileDrawerProps) => {
	const controls = useAnimation();
	const y = useMotionValue(0);
	const [drawerState, setDrawerState] = useState<'closed' | 'peek' | 'full'>('closed');

	// Calculate background opacity based on drawer position
	const bgOpacity = useTransform(y, [0, window.innerHeight], [0.5, 0]);
	const peekContentOpacity = useTransform(y, [0, window.innerHeight - DRAWER_PEEK_HEIGHT], [0, 1]);
	const fullContentOpacity = useTransform(y, [0, window.innerHeight - DRAWER_PEEK_HEIGHT], [1, 0]);

	useEffect(() => {
		if (isOpen && drawerState === 'closed') {
			setDrawerState('peek');
			controls.start({ y: window.innerHeight - DRAWER_PEEK_HEIGHT });
		} else if (!isOpen && drawerState !== 'closed') {
			setDrawerState('closed');
			controls.start({ y: window.innerHeight });
		}
	}, [isOpen, controls, drawerState]);

	const handleDragEnd = (event: any, info: any) => {
		const velocity = info.velocity.y;
		const position = info.point.y;
		const threshold = window.innerHeight * 0.3;

		if (velocity > 500) {
			// Fast downward swipe - close drawer
			setDrawerState('closed');
			onClose();
			controls.start({ y: window.innerHeight });
		} else if (velocity < -500) {
			// Fast upward swipe - open fully
			setDrawerState('full');
			controls.start({ y: 0 });
		} else {
			// Based on position
			if (position > window.innerHeight - threshold) {
				// Close
				setDrawerState('closed');
				onClose();
				controls.start({ y: window.innerHeight });
			} else if (position > DRAWER_PEEK_HEIGHT) {
				// Peek
				setDrawerState('peek');
				controls.start({ y: window.innerHeight - DRAWER_PEEK_HEIGHT });
			} else {
				// Full
				setDrawerState('full');
				controls.start({ y: 0 });
			}
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
							}}
							drag="y"
							dragConstraints={{ top: 0, bottom: window.innerHeight }}
							dragElastic={0.2}
							dragMomentum={false}
							onDragEnd={handleDragEnd}
							animate={controls}
							initial={{ y: window.innerHeight }}
							exit={{ y: window.innerHeight }}
							transition={{
								type: 'spring',
								damping: 20,
								stiffness: 300,
							}}
						>
							<div className="p-4 border-b">
								<div className="w-12 h-1.5 bg-muted-foreground/20 mx-auto rounded-full mb-4" />
								<div className="flex justify-between items-center">
									<h2 className="text-lg font-semibold">{title}</h2>
									<button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
										<ChevronDown className="w-6 h-6" />
									</button>
								</div>
							</div>

							{/* Peek Content */}
							{peekContent && (
								<motion.div
									className="p-4"
									style={{
										opacity: peekContentOpacity,
										display: drawerState === 'full' ? 'none' : 'block',
									}}
								>
									{peekContent}
								</motion.div>
							)}

							{/* Full Content */}
							<motion.div
								className="overflow-auto"
								style={{
									height: `calc(${DRAWER_FULL_HEIGHT} - 5rem)`,
									opacity: fullContentOpacity,
									display: drawerState === 'peek' ? 'none' : 'block',
								}}
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
