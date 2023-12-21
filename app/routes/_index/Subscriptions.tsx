import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAccount } from "wagmi";

import incomingImg from "~/assets/icons/incoming.svg";
import outgoingImg from "~/assets/icons/outgoing.svg";
import { useHydrated } from "~/hooks/useHydrated";
import { DAI_OPTIMISM } from "~/lib/constants";
import { type IFormattedSub, type ISub } from "~/types";

import { SUB_CHAIN_LIB, formatSubs } from "./utils";

async function getSubscriptions(address?: string) {
	try {
		if (!address) return null;

		const subs = gql`
			{
				subs(
					where: {
						or: [
							{ owner: "${address.toLowerCase()}" },
							{ receiver: "${address.toLowerCase()}" }
						]
					}
					orderBy: expirationDate
					orderDirection: desc
				) {
					id
					owner
					receiver
					startTimestamp
					unsubscribed
					initialShares
					initialPeriod
					expirationDate
					amountPerCycle
					realExpiration
					accumulator
				}
			}
		`;
		const data: { subs: Array<ISub> } = await request(SUB_CHAIN_LIB.subgraphs.subscriptions, subs);

		return formatSubs(data?.subs ?? []);
	} catch (error: any) {
		throw new Error(error.message ?? "Failed to fetch subscriptions");
	}
}

export const Subscriptions = () => {
	const { address } = useAccount();

	const {
		data: subs,
		isLoading: fetchingSubs,
		error: errorFetchingSubs
	} = useQuery(["subs", address], () => getSubscriptions(address), {
		cacheTime: 20_000,
		refetchInterval: 20_000
	});

	const hydrated = useHydrated();

	return (
		<>
			{!hydrated || fetchingSubs ? (
				<p className="text-center text-sm">Loading...</p>
			) : !address ? (
				<p className="text-center text-sm">Connect wallet to view your subscriptions</p>
			) : errorFetchingSubs || !subs ? (
				<p className="text-center text-sm text-red-500">
					{(errorFetchingSubs as any)?.message ?? "Failed to fetch subscriptions"}
				</p>
			) : subs.length === 0 ? (
				<p className="text-center text-sm text-orange-500">You do not have any subscriptions</p>
			) : (
				<table className="w-full table-auto border-collapse">
					<thead>
						<tr>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Type</th>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
								Address
							</th>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
								Total Paid
							</th>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
								Duration
							</th>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Expiry</th>
							<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Status</th>
						</tr>
					</thead>
					<tbody>
						{subs.map((sub) => (
							<Sub key={sub.id} data={sub} address={address} />
						))}
					</tbody>
				</table>
			)}
		</>
	);
};

const Sub = ({ data, address }: { data: IFormattedSub; address: string }) => {
	const status = data.unsubscribed
		? "Unsubscribed"
		: data.realExpiration * 1000 < new Date().getTime()
			? "Expired"
			: "Active";

	const incoming = data.receiver === address.toLowerCase();

	return (
		<tr>
			<td className="p-3">
				{incoming ? <img src={incomingImg} alt="incoming" /> : <img src={outgoingImg} alt="outgoing" />}
			</td>
			<td className="p-3">
				{incoming ? (
					data.owner ? (
						<a
							target="_blank"
							rel="noopene noreferrer"
							href={`https://optimistic.etherscan.io/address/${data.owner}`}
							className="underline"
						>
							{data.owner.slice(0, 4) + "..." + data.owner.slice(-4)}
						</a>
					) : null
				) : data.receiver ? (
					<a
						target="_blank"
						rel="noopene noreferrer"
						href={`https://optimistic.etherscan.io/address/${data.receiver}`}
						className="underline"
					>
						{data.receiver.slice(0, 4) + "..." + data.receiver.slice(-4)}
					</a>
				) : null}
			</td>
			<td className="p-3">
				<span className="flex flex-nowrap items-center gap-1">
					<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
					<span className="whitespace-nowrap">{`${data.totalAmountPaid} DAI`}</span>
				</span>
			</td>
			<td className="whitespace-nowrap p-3">{data.subDurationFormatted}</td>
			<td className="whitespace-nowrap p-3">{`${new Date(data.expirationDate * 1000).toLocaleString()}`}</td>
			<td className="p-3">{status}</td>
		</tr>
	);
};
