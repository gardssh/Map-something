'use client';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useState } from 'react';

interface MobileDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}

const DRAWER_FULL_HEIGHT = 'calc(100vh - 4rem)';

export const MobileDrawer = ({ isOpen, onClose, children, title }: MobileDrawerProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const dragControls = useDragControls();

	const handleDragEnd = (event: any, info: any) => {
		setIsDragging(false);
		const velocity = info.velocity.y;
		const position = info.point.y;
		const threshold = window.innerHeight * 0.3;

		if (velocity > 500 || position > threshold) {
			onClose();
		}
	};

	const startDrag = (event: React.PointerEvent) => {
		dragControls.start(event);
		setIsDragging(true);
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
							className="absolute bottom-0 left-0 right-0 bg-background pointer-events-auto rounded-t-xl overflow-hidden shadow-lg flex flex-col"
							style={{ height: DRAWER_FULL_HEIGHT }}
							initial={{ y: window.innerHeight }}
							animate={{ y: 0 }}
							exit={{ y: window.innerHeight }}
							transition={{
								type: 'spring',
								damping: 30,
								stiffness: 200,
							}}
							drag="y"
							dragControls={dragControls}
							dragListener={false}
							dragConstraints={{ top: 0, bottom: window.innerHeight }}
							dragElastic={0.1}
							dragMomentum={false}
							onDragEnd={handleDragEnd}
						>
							<div className="absolute inset-x-0 -top-8 h-8 bg-background" />
							{/* Header */}
							<div className="p-4 border-b cursor-grab active:cursor-grabbing touch-none" onPointerDown={startDrag}>
								<div className="w-12 h-1.5 bg-muted-foreground/20 mx-auto rounded-full mb-4" />
								<div className="flex justify-between items-center">
									<h2 className="text-lg font-semibold">{title}</h2>
								</div>
							</div>
							{/* Scrollable content */}
							<div className="flex-1 overflow-auto overscroll-contain">
								<div className="p-4">{children}</div>
							</div>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
};
