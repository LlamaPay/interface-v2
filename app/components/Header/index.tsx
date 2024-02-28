import { Link } from "@remix-run/react";
import { lazy, Suspense } from "react";
import { useAccount } from "wagmi";

import logoDark from "~/assets/icons/logo-dark.svg";
import logoLight from "~/assets/icons/logo-light.svg";
import moon from "~/assets/icons/moon.svg";
import sun from "~/assets/icons/sun.svg";
import { Icon } from "~/components/Icon";
import { useHydrated } from "~/hooks/useHydrated";
import { Theme, useTheme } from "~/utils/theme-provider";

const AccountMenu = lazy(() =>
	import("~/components/Header/AccountMenu").then((module) => ({ default: module.AccountMenu }))
);
const AppMenu = lazy(() => import("~/components/Header/AppMenu").then((module) => ({ default: module.AppMenu })));
const ConnectWallet = lazy(() =>
	import("~/components/ConnectWallet").then((module) => ({ default: module.ConnectWallet }))
);
const NetworkMenu = lazy(() =>
	import("~/components/Header/NetworkMenu").then((module) => ({ default: module.NetworkMenu }))
);

export const Header = () => {
	const [theme, setTheme] = useTheme();
	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
	};
	const hydrated = useHydrated();
	const { isConnected } = useAccount();

	return (
		<header className="col-span-full flex flex-wrap items-center gap-4 border-b border-black/5 p-4 dark:border-white/5 md:px-8">
			<Link to="/" className="mr-auto h-8 md:h-10">
				<img src={theme === "dark" ? logoLight : logoDark} alt="" className="mr-auto h-8 md:h-10" />
				<span className="sr-only">navigate to home page</span>
			</Link>

			{hydrated ? (
				<>
					{!isConnected ? (
						<Suspense
							fallback={
								<button
									className="h-10 rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white"
									disabled
								>
									Connect Wallet
								</button>
							}
						>
							<ConnectWallet className="h-10 rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white" />
						</Suspense>
					) : (
						<>
							<Suspense fallback={<></>}>
								<NetworkMenu />
							</Suspense>
							<Suspense fallback={<></>}>
								<AccountMenu />
							</Suspense>
							<Suspense
								fallback={
									<button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white md:hidden">
										<span className="sr-only">Open Menu</span>
										<Icon className="h-4 w-4 flex-shrink-0 text-[#3D3D3D] dark:text-white/60" name="three-dots" />
									</button>
								}
							>
								<AppMenu />
							</Suspense>
						</>
					)}
				</>
			) : null}
			<button
				className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white md:flex"
				onClick={toggleTheme}
			>
				<img src={theme === "dark" ? moon : sun} alt="" className="h-4" />
				<span className="sr-only">Change Theme</span>
			</button>
		</header>
	);
};
