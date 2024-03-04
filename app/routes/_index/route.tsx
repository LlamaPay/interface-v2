import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";
import { Suspense, lazy, useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount, useQuery } from "wagmi";

import incomingImg from "~/assets/icons/incoming.svg";
import outgoingImg from "~/assets/icons/outgoing.svg";
import spriteHref from "~/assets/icons/sprite2.svg";
import { Icon } from "~/components/Icon";
import { useHydrated } from "~/hooks/useHydrated";
import { DAI_OPTIMISM } from "~/lib/constants";

import { getSubscriptions } from "./data";

const defaultSelectedId = "subscriptions";

const Claim = lazy(() =>
	import("./Claim").then((module) => ({ default: module.Claim })),
);
const Subscriptions = lazy(() =>
	import("./Subscriptions").then((module) => ({
		default: module.Subscriptions,
	})),
);

export default function Index() {
	const hydrated = useHydrated();
	const { address, isConnected } = useAccount();

	const {
		data: subs,
		isLoading: fetchingSubs,
		error: errorFetchingSubs,
	} = useQuery(["subs", address], () => getSubscriptions(address), {
		refetchInterval: 20_000,
	});

	const { totalEarnings, totalExpenditure } = useMemo(() => {
		if (!subs || !address) {
			return { totalEarnings: "0", totalExpenditure: "0" };
		}
		const snapshotTimestamp = new Date().getTime();
		const activeSubs = subs.filter(
			(sub) =>
				+sub.startTimestamp <= snapshotTimestamp / 1e3 &&
				+sub.realExpiration >= snapshotTimestamp / 1e3,
		);
		const totalEarnings = activeSubs.reduce((acc, curr) => {
			return (acc +=
				curr.receiver === address.toLowerCase()
					? BigInt(curr.amountPerCycle)
					: 0n);
		}, 0n);
		const totalExpenditure = activeSubs.reduce((acc, curr) => {
			return (acc +=
				curr.receiver !== address.toLowerCase()
					? BigInt(curr.amountPerCycle)
					: 0n);
		}, 0n);
		return {
			totalEarnings: formatUnits(totalEarnings, DAI_OPTIMISM.decimals),
			totalExpenditure: formatUnits(totalExpenditure, DAI_OPTIMISM.decimals),
		};
	}, [subs, address]);

	return (
		<main className="isolate flex flex-col gap-5 overflow-x-hidden px-4 py-9 md:pr-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
				{links.map((l) => (
					<Link
						to={l.to}
						key={l.to}
						className="flex flex-nowrap items-center gap-2 rounded-lg border border-black/5 bg-[#FCFFFE] p-3  shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:border-black dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:border-white"
					>
						<svg className="h-8 w-8">
							<use href={`${spriteHref}#${l.iconId}`} />
						</svg>
						<span className="flex flex-col">
							<span className="text-[#111827] dark:text-[#dcdcdc]">
								{l.name}
							</span>
							<span className="text-sm text-[#596575] dark:text-[#838486]">
								{l.description}
							</span>
						</span>
						<Icon name="arrow-right" className="ml-4 h-4 w-4" />
					</Link>
				))}
				<div className="flex flex-col gap-1 rounded-lg border border-black/5 bg-[#FCFFFE]  p-3 text-sm shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]">
					<p className="flex items-center gap-1">
						<img src={incomingImg} alt="incoming" />
						<span>Earnings : </span>
						{isConnected && subs ? (
							<span className="flex flex-nowrap items-center gap-1">
								<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
								<span className="whitespace-nowrap">
									<strong>{totalEarnings}</strong> DAI / month
								</span>
							</span>
						) : null}
					</p>
					<p className="flex items-center gap-1">
						<img src={outgoingImg} alt="incoming" />
						<span>Expenses : </span>
						{isConnected && subs ? (
							<span className="flex flex-nowrap items-center gap-1">
								<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
								<span className="whitespace-nowrap">
									<strong>{totalExpenditure}</strong> DAI / month
								</span>
							</span>
						) : null}
					</p>
				</div>
			</div>
			<div className="rounded-lg border border-black/5 bg-[#FCFFFE] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]">
				<Ariakit.TabProvider defaultSelectedId={defaultSelectedId}>
					<Ariakit.TabList
						className="flex flex-wrap items-center gap-6 p-5 pb-0"
						aria-label="Mange Subscriptions"
					>
						<Ariakit.Tab
							className="group flex flex-nowrap items-center gap-1 border-b border-b-transparent pb-3 text-sm font-medium data-[active-item]:border-b-[#13785a] data-[active-item]:text-[#13785a] dark:data-[active-item]:border-b-[#21B58A] dark:data-[active-item]:text-[#21B58A]"
							id="subscriptions"
						>
							<span>Subscriptions</span>
							{/* <span className="rounded-full bg-[#F5F5F5] p-1 group-data-[active-item]:bg-[#E0FFF6] dark:bg-[#3b3b3b] dark:group-data-[active-item]:bg-[#323a37]">
								0
							</span> */}
						</Ariakit.Tab>
						<Ariakit.Tab
							className="group flex flex-nowrap items-center gap-1 border-b border-b-transparent pb-3 text-sm font-medium data-[active-item]:border-b-[#13785a] data-[active-item]:text-[#13785a] dark:data-[active-item]:border-b-[#21B58A] dark:data-[active-item]:text-[#21B58A]"
							id="claim"
						>
							<span>Claim</span>
						</Ariakit.Tab>
					</Ariakit.TabList>
					<Ariakit.TabPanel
						className="mt-1 w-full overflow-x-auto p-5 md:max-w-[calc(100vw-204px-32px-4px)]"
						tabId="subscriptions"
					>
						<Suspense fallback={<p />}>
							{hydrated ? (
								<Subscriptions />
							) : (
								<p className="text-center text-sm">Loading...</p>
							)}
						</Suspense>
					</Ariakit.TabPanel>
					<Ariakit.TabPanel
						className="mt-1 w-full overflow-x-auto p-5 md:max-w-[calc(100vw-204px-32px-4px)]"
						tabId="claim"
					>
						<Suspense fallback={<p />}>
							{hydrated ? (
								<Claim />
							) : (
								<p className="text-center text-sm">Loading...</p>
							)}
						</Suspense>
					</Ariakit.TabPanel>
				</Ariakit.TabProvider>
			</div>
		</main>
	);
}

const links = [
	{
		name: "Create a new subscription",
		description: "Subscriptions made simple",
		to: "/create/subscription",
		iconId: "stream",
	},
];
