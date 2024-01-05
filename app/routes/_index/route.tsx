import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";
import { Suspense, lazy } from "react";

import spriteHref from "~/assets/icons/sprite2.svg";
import { Icon } from "~/components/Icon";
import { useHydrated } from "~/hooks/useHydrated";

const defaultSelectedId = "subscriptions";

const Claim = lazy(() => import("./Claim").then((module) => ({ default: module.Claim })));
const Subscriptions = lazy(() => import("./Subscriptions").then((module) => ({ default: module.Subscriptions })));
const Unsubscribe = lazy(() => import("./Unsubscribe").then((module) => ({ default: module.Unsubscribe })));

export default function Index() {
	const hydrated = useHydrated();
	return (
		<main className="flex flex-col gap-5 overflow-x-hidden px-4 py-9 md:pr-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
				{links.map((l) => (
					<Link
						to={l.to}
						key={l.to}
						className="flex flex-nowrap items-center gap-2 rounded-lg border border-black/5  bg-[#FCFFFE] p-3 shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]"
					>
						<svg className="h-8 w-8">
							<use href={`${spriteHref}#${l.iconId}`} />
						</svg>
						<span className="flex flex-col">
							<span className="text-[#111827] dark:text-[#dcdcdc]">{l.name}</span>
							<span className="text-sm text-[#596575] dark:text-[#838486]">{l.description}</span>
						</span>
						<Icon name="arrow-right" className="ml-4 h-4 w-4" />
					</Link>
				))}
			</div>
			<div className="rounded-lg border border-black/5 bg-[#FCFFFE] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]">
				<Ariakit.TabProvider defaultSelectedId={defaultSelectedId}>
					<Ariakit.TabList className="flex flex-wrap items-center gap-6 p-5 pb-0" aria-label="Mange Subscriptions">
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
							id="unsubscribe"
						>
							<span>Unsubscribe</span>
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
						<Suspense fallback={<></>}>
							{hydrated ? <Subscriptions /> : <p className="text-center text-sm">Loading...</p>}
						</Suspense>
					</Ariakit.TabPanel>
					<Ariakit.TabPanel
						className="mt-1 w-full overflow-x-auto p-5 md:max-w-[calc(100vw-204px-32px-4px)]"
						tabId="unsubscribe"
					>
						<Suspense fallback={<></>}>
							{hydrated ? <Unsubscribe /> : <p className="text-center text-sm">Loading...</p>}
						</Suspense>
					</Ariakit.TabPanel>
					<Ariakit.TabPanel
						className="mt-1 w-full overflow-x-auto p-5 md:max-w-[calc(100vw-204px-32px-4px)]"
						tabId="claim"
					>
						<Suspense fallback={<></>}>
							{hydrated ? <Claim /> : <p className="text-center text-sm">Loading...</p>}
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
		iconId: "stream"
	}
];
