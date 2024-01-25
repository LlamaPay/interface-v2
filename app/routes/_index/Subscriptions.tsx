import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useMemo, useState } from "react";
import { formatUnits, getAddress } from "viem";
import { optimism } from "viem/chains";
import { useAccount } from "wagmi";

import incomingImg from "~/assets/icons/incoming.svg";
import outgoingImg from "~/assets/icons/outgoing.svg";
import { EndsIn } from "~/components/EndsIn";
import { Icon } from "~/components/Icon";
import { useHydrated } from "~/hooks/useHydrated";
import { DAI_OPTIMISM } from "~/lib/constants";
import { useGetEnsName } from "~/queries/useGetEnsName";
import { type IFormattedSub, type ISub } from "~/types";

import { ManageSub } from "./ManageSub";
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
					orderBy: realExpiration
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
					creationTx
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
		refetchInterval: 20_000
	});

	const { totalEarnings, totalExpenditure } = useMemo(() => {
		if (!subs || !address) {
			return { totalEarnings: "0", totalExpenditure: "0" };
		}
		const snapshotTimestamp = new Date().getTime();
		const activeSubs = subs.filter(
			(sub) => +sub.startTimestamp <= snapshotTimestamp / 1e3 && +sub.realExpiration >= snapshotTimestamp / 1e3
		);
		const totalEarnings = activeSubs.reduce((acc, curr) => {
			return (acc += curr.receiver === address.toLowerCase() ? BigInt(curr.amountPerCycle) : 0n);
		}, 0n);
		const totalExpenditure = activeSubs.reduce((acc, curr) => {
			return (acc += curr.receiver !== address.toLowerCase() ? BigInt(curr.amountPerCycle) : 0n);
		}, 0n);
		return {
			totalEarnings: formatUnits(totalEarnings, DAI_OPTIMISM.decimals),
			totalExpenditure: formatUnits(totalExpenditure, DAI_OPTIMISM.decimals)
		};
	}, [subs, address]);

	const hydrated = useHydrated();

	const [snapshotDate, setSnapshotDate] = useState<string>("");

	const downloadActiveSubs = (selectedSnapshotDate: string) => {
		if (subs && selectedSnapshotDate !== "" && address) {
			const snapshotTimestamp = new Date(selectedSnapshotDate).getTime();
			const activeSubs = subs.filter(
				(sub) => +sub.startTimestamp <= snapshotTimestamp / 1e3 && +sub.realExpiration >= snapshotTimestamp / 1e3
			);
			const rows = [["Address", "Amount per month"]];
			activeSubs.forEach((sub) => {
				const incoming = sub.receiver === address.toLowerCase();
				if (incoming) {
					rows.push([
						incoming ? sub.owner : sub.receiver,
						formatUnits(BigInt(sub.amountPerCycle), DAI_OPTIMISM.decimals)
					]);
				}
			});

			download(`subscriptions-snapshot-${selectedSnapshotDate}.csv`, rows.map((r) => r.join(",")).join("\n"));
		}
	};

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
				<>
					<div className="mb-5 flex flex-wrap items-center gap-4">
						<p className="flex gap-2 rounded-lg border border-green-500 p-2">
							<span>Total Earnings : </span>
							<span className="flex flex-nowrap items-center gap-1">
								<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
								<span className="whitespace-nowrap">
									<strong>{totalEarnings}</strong> DAI / month
								</span>
							</span>
						</p>
						<p className="flex gap-2 rounded-lg border border-red-500 p-2">
							<span>Total Expenses : </span>
							<span className="flex flex-nowrap items-center gap-1">
								<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
								<span className="whitespace-nowrap">
									<strong>{totalExpenditure}</strong> DAI / month
								</span>
							</span>
						</p>
					</div>
					<table className="w-full border-collapse">
						<thead>
							<tr>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Type</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
									Address
								</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Tier</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
									Time Left
								</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
									Status
								</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">
									Balance
								</th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]"></th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]"></th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]"></th>
								<th className="whitespace-nowrap p-3 text-left font-normal text-[#596575] dark:text-[#838486]">Tx</th>
							</tr>
						</thead>
						<tbody>
							{subs.map((sub) => (
								<Sub key={sub.id} data={sub} address={address} />
							))}
						</tbody>
					</table>
					<form className="flex flex-wrap items-end gap-4 text-sm">
						<label className="mt-5 flex flex-col gap-1">
							<span>Snapshot</span>
							<input
								type="date"
								name="snapshot"
								value={snapshotDate}
								onChange={(e) => setSnapshotDate(e.target.value)}
								className="rounded-lg border border-black/[0.15] bg-[#ffffff] p-1 dark:border-white/5 dark:bg-[#141414]"
							/>
						</label>
						<button
							type="button"
							className="rounded-lg border border-black/[0.15] bg-[#13785a] p-1 px-2 text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/5 dark:bg-[#23BF91] dark:text-black"
							onClick={() => downloadActiveSubs(snapshotDate)}
							disabled={snapshotDate === ""}
						>
							Download
						</button>

						<button
							type="button"
							className="rounded-lg border border-black/[0.15] bg-[#13785a] p-1 px-2 text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/5 dark:bg-[#23BF91] dark:text-black"
							onClick={() => downloadActiveSubs(new Date().toUTCString())}
						>
							Download current snapshot
						</button>
					</form>
				</>
			)}
		</>
	);
};

const Sub = ({ data, address }: { data: IFormattedSub; address: string }) => {
	const status =
		data.startTimestamp === data.realExpiration
			? "Cancelled"
			: +data.startTimestamp > Date.now() / 1e3
				? "Not yet started"
				: +data.realExpiration < Date.now() / 1e3
					? "Expired"
					: "Active";

	const incoming = data.receiver === address.toLowerCase();

	const subAddress = incoming ? data.owner : data.receiver;

	const { data: ensName } = useGetEnsName({
		address: getAddress(subAddress)
	});

	return (
		<tr>
			<td className="p-3" title={incoming ? "Incoming" : "Outgoing"}>
				{incoming ? <img src={incomingImg} alt="incoming" /> : <img src={outgoingImg} alt="outgoing" />}
			</td>
			<td className="p-3">
				<a
					target="_blank"
					rel="noopene noreferrer"
					href={`https://optimistic.etherscan.io/address/${subAddress}`}
					className="underline"
				>
					{ensName ?? subAddress.slice(0, 4) + "..." + subAddress.slice(-4)}
				</a>
			</td>
			<td className="p-3">
				<span className="flex flex-nowrap items-center gap-1">
					<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
					<span className="whitespace-nowrap">{`${formatUnits(
						BigInt(data.amountPerCycle),
						DAI_OPTIMISM.decimals
					)} DAI / month`}</span>
				</span>
			</td>
			<td className="p-3">
				{status === "Active" ? (
					<p
						className="whitespace-nowrap tabular-nums"
						title={`Expiry: ${new Date(+data.realExpiration * 1000).toLocaleString()}`}
					>
						<EndsIn deadline={+data.realExpiration * 1000} />
					</p>
				) : (
					"-"
				)}
			</td>
			<td className="whitespace-nowrap p-3">{status}</td>
			{incoming ? (
				<>
					<td className="whitespace-nowrap p-3 text-center"></td>
					<td className="whitespace-nowrap p-3 text-center"></td>
					<td className="whitespace-nowrap p-3 text-center"></td>
					<td className="whitespace-nowrap p-3 text-center"></td>
				</>
			) : (
				<ManageSub data={data} />
			)}
			<td className="whitespace-nowrap p-3 text-center">
				<a
					href={`${optimism.blockExplorers.etherscan.url}/tx/${data.creationTx}`}
					target="_blank"
					rel="noreferrer noopener"
				>
					<Icon name="external-link" className="h-4 w-4" />
					<span className="sr-only">link to transaction on chain</span>
				</a>
			</td>
		</tr>
	);
};

function download(filename: string, text: string) {
	const element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}
