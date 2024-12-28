import { Navbar } from '@/features/shared/components/navigation/Navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Navbar />
			{children}
		</>
	);
}
