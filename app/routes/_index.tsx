import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";

import spriteHref from "~/assets/icons/sprite2.svg";

const defaultSelectedId = "subscriptions";

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
					<Ariakit.TabList className="p-5 pb-0" aria-label="Payment Type">
						<Ariakit.Tab
							className="group flex flex-nowrap items-center gap-1 border-b border-b-transparent pb-3 text-sm font-medium data-[active-item]:border-b-[#13785a] data-[active-item]:text-[#13785a] dark:data-[active-item]:border-b-[#21B58A] dark:data-[active-item]:text-[#21B58A]"
							id="subscriptions"
						>
							<span>Subscriptions</span>
							<span className="rounded-full bg-[#F5F5F5] p-1 group-data-[active-item]:bg-[#E0FFF6] dark:bg-[#3b3b3b] dark:group-data-[active-item]:bg-[#323a37]">
								0
							</span>
						</Ariakit.Tab>
					</Ariakit.TabList>
					<div className="panels">
						<Ariakit.TabPanel tabId="subscriptions">
							<p className="p-10 text-center">You do not have any active subscriptions</p>
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
