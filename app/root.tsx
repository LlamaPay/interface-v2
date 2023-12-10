import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetchers,
	useNavigation
} from "@remix-run/react";
import NProgress from "nprogress";
import { useEffect, useMemo } from "react";

import nProgressStyles from "~/styles/nprogress.css";
import tailwindHref from "~/styles/tailwind.css";

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
	{ rel: "preload stylesheet", as: "style", crossOrigin: "anonymous" as any, href: tailwindHref }
];

NProgress.configure({ showSpinner: false });

export default function App() {
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
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
				<link rel="stylesheet" href={nProgressStyles} />
			</body>
		</html>
	);
}
