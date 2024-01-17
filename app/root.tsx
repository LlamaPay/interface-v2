import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetchers,
	useLoaderData,
	useLocation,
	useNavigation
} from "@remix-run/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NProgress from "nprogress";
import { useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";

import interFont from "~/assets/fonts/InterVariable.woff2";
import { Header } from "~/components/Header";
import { Nav } from "~/components/Nav";
import { WalletProvider } from "~/lib/wallet";
import nProgressStyles from "~/styles/nprogress.css";
import tailwindHref from "~/styles/tailwind.css";
import { ThemeBody, ThemeHead, ThemeProvider, useTheme } from "~/utils/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

const queryClient = new QueryClient();

export const loader: LoaderFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);

	const data = {
		theme: themeSession.getTheme()
	};

	return data;
};

export const meta: MetaFunction = () => {
	return [
		{ title: "LlamaPay" },
		{
			name: "description",
			content:
				"LlamaPay is a multi-chain protocol that allows you to automate transactions and stream them by the second. The recipients can withdraw these funds at any time. This eliminates the need for manual transactions."
		}
	];
};

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
	{ rel: "preload stylesheet", as: "style", crossOrigin: "anonymous" as any, href: tailwindHref },
	{ rel: "preload", as: "font", crossOrigin: "anonymous" as any, href: interFont }
];

const rootStyle = `@font-face {
	font-family: InterVariable;
	font-style: normal;
	font-weight: 100 900;
	font-display: swap;
	src: url(${interFont}) format(woff2);
}`;

NProgress.configure({ showSpinner: false });

function App() {
	const data = useLoaderData<typeof loader>();
	const [theme] = useTheme();

	const location = useLocation();
	const navigation = useNavigation();
	const fetchers = useFetchers();

	/**
	 * This gets the state of every fetcher active on the app and combine it with
	 * the state of the global transition (Link and Form), then use them to
	 * determine if the app is idle or if it's loading.
	 * Here we consider both loading and submitting as loading.
	 */
	const state = useMemo<"idle" | "loading">(
		function getGlobalState() {
			const states = [navigation.state, ...fetchers.map((fetcher) => fetcher.state)];
			if (states.every((state) => state === "idle")) return "idle";
			return "loading";
		},
		[navigation.state, fetchers]
	);

	useEffect(() => {
		// and when it's something else it means it's either submitting a form or
		// waiting for the loaders of the next location so we start it
		if (state === "loading") NProgress.start();
		// when the state is idle then we can to complete the progress bar
		if (state === "idle") NProgress.done();
	}, [state]);

	return (
		<html lang="en" className={theme ?? ""}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<style>{rootStyle}</style>
				<Meta />
				<Links />
				<ThemeHead ssrTheme={Boolean(data.theme)} />
			</head>
			<body>
				{location.pathname === "/subscribe" ? (
					<></>
				) : (
					<>
						<Header />
						<Nav />
					</>
				)}
				<Outlet />
				<ThemeBody ssrTheme={Boolean(data.theme)} />
				<Toaster position="top-right" reverseOrder={false} />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
				<link rel="stylesheet" href={nProgressStyles} />
			</body>
		</html>
	);
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>();

	return (
		<ThemeProvider specifiedTheme={data.theme}>
			<WalletProvider>
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>
			</WalletProvider>
		</ThemeProvider>
	);
}
