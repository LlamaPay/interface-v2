import { lazy, Suspense } from "react";
import { useAccount } from "wagmi";

import logoDark from "~/assets/icons/logo-dark.svg";
import logoLight from "~/assets/icons/logo-light.svg";
import moon from "~/assets/icons/moon.svg";
import sun from "~/assets/icons/sun.svg";
import { useHydrated } from "~/hooks/useHydrated";
import { Theme, useTheme } from "~/utils/theme-provider";

const ConnectWallet = lazy(() =>
	import("~/components/ConnectWallet").then((module) => ({ default: module.ConnectWallet }))
);

export const Header = () => {
	const [theme, setTheme] = useTheme();
	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
	};
	const hydrated = useHydrated();
	const { isConnected } = useAccount();

	return (
		<header className="flex flex-wrap items-center gap-4 border-b border-black/5 p-4 dark:border-white/5 md:px-8">
			<img src={theme === "dark" ? logoLight : logoDark} alt="" className="mr-auto h-5 md:h-10" />

			{hydrated ? (
				<>
					{!isConnected ? (
						<Suspense fallback={<HeaderButton disabled>Connect Wallet</HeaderButton>}>
							<ConnectWallet className="rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white" />
						</Suspense>
					) : null}
				</>
			) : null}
			<HeaderButton onClick={toggleTheme}>
				<img src={theme === "dark" ? moon : sun} alt="" className="h-6" />
				<span className="sr-only"></span>
			</HeaderButton>
		</header>
	);
};

interface HeaderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
}

const HeaderButton = ({ children, ...props }: HeaderButtonProps) => {
	return (
		<button
			className="rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white"
			{...props}
		>
			{children}
		</button>
	);
};
