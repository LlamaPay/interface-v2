import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";
import { Suspense, lazy } from "react";

import spriteHref from "~/assets/icons/sprite2.svg";

const defaultSelectedId = "unsubscribe";

const Claim = lazy(() => import("./Claim").then((module) => ({ default: module.Claim })));
const Unsubscribe = lazy(() => import("./Unsubscribe").then((module) => ({ default: module.Unsubscribe })));

export default function Index() {
	return (
		<main className="flex flex-col gap-5 px-4 py-9 md:px-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
				{links.map((l) => (
					<Link
						to={l.to}
						key={l.to}
						className="flex flex-1 flex-nowrap items-center gap-2 rounded-lg border border-black/5  bg-[#FCFFFE] p-3 shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]"
					>
						<svg className="h-8 w-8">
							<use href={`${spriteHref}#${l.iconId}`} />
						</svg>
						<span className="flex flex-col">
							<span className="text-[#111827] dark:text-[#dcdcdc]">{l.name}</span>
							<span className="text-sm text-[#596575] dark:text-[#838486]">{l.description}</span>
						</span>
					</Link>
				))}
			</div>
			<div className="rounded-lg border border-black/5 bg-[#FCFFFE] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#1a1a1a]">
				<Ariakit.TabProvider defaultSelectedId={defaultSelectedId}>
					<Ariakit.TabList className="flex flex-wrap items-center gap-6 p-5 pb-0" aria-label="Mange Subscriptions">
						<Ariakit.Tab
							className="group flex flex-nowrap items-center gap-1 border-b border-b-transparent pb-3 text-sm font-medium data-[active-item]:border-b-[#13785a] data-[active-item]:text-[#13785a] dark:data-[active-item]:border-b-[#21B58A] dark:data-[active-item]:text-[#21B58A]"
							id="unsubscribe"
						>
							<span>Unsubscribe</span>
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
					<div className="mt-1 p-5">
						<Ariakit.TabPanel tabId="unsubscribe">
							<Suspense fallback={<></>}>
								<Unsubscribe />
							</Suspense>
						</Ariakit.TabPanel>
						<Ariakit.TabPanel tabId="claim">
							<Suspense fallback={<></>}>
								<Claim />
							</Suspense>
						</Ariakit.TabPanel>
					</div>
				</Ariakit.TabProvider>
			</div>
		</main>
	);
}

const links = [
	{
		name: "Create a new Subscription",
		description: "Subscriptions made simple",
		to: "/create/subscription",
		iconId: "stream"
	}
];