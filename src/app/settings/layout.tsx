import { Navbar } from '@/features/shared/components/navigation/Navbar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Navbar />
			{children}
		</>
	);
}
