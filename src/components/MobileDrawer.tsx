'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface MobileDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}

export const MobileDrawer = ({ isOpen, onClose, children, title }: MobileDrawerProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 pointer-events-none z-[5]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="absolute bottom-0 left-0 right-0 bg-background pointer-events-auto rounded-t-xl overflow-hidden shadow-lg"
						style={{
							height: 'calc(100vh - 4rem)',
						}}
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={0.2}
						dragMomentum={false}
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
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
						<motion.div
							className="overflow-auto"
							style={{ height: 'calc(100vh - 12rem)' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<div className="p-4">{children}</div>
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
