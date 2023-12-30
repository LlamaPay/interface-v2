import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { formatUnits } from "viem";
import { optimism } from "viem/chains";
import { useAccount, useContractWrite, useNetwork, useWaitForTransaction } from "wagmi";

import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, SUBSCRIPTION_AMOUNT_DIVISOR, SUBSCRIPTION_DURATION } from "~/lib/constants";
import { type IFormattedSub, type ISub } from "~/types";
import { formatNum } from "~/utils/formatNum";

import { SUB_CHAIN_LIB, subsContract, contract, client, formatSubs } from "./utils";

async function calculateSubBalance({ sub, contract, client }: { sub: IFormattedSub; contract: any; client: any }) {
	if (!sub) return null;
	const initialShares = BigInt(sub.initialShares);

	const currentTimestamp = BigInt(Math.floor(Date.now() / 1e3));

	if (+sub.expirationDate > currentTimestamp) {
		// eslint-disable-next-line
		let [sharesAccumulator, currentPeriod]: [bigint, bigint] = await Promise.all([
			contract.read.sharesAccumulator(),
			contract.read.currentPeriod()
		]);

		if (currentPeriod + BigInt(SUBSCRIPTION_DURATION) < currentTimestamp) {
			const shares: bigint = await contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]);
			sharesAccumulator += ((currentTimestamp - BigInt(currentPeriod)) / BigInt(SUBSCRIPTION_DURATION)) * shares;
		}

		const sharesPaid =
			((sharesAccumulator - BigInt(sub.accumulator)) * BigInt(sub.amountPerCycle)) /
			BigInt(SUBSCRIPTION_AMOUNT_DIVISOR);

		const sharesLeft = initialShares - sharesPaid;

		const balance: bigint = await contract.read.convertToAssets([sharesLeft]);

		return balance;
	} else {
		const periods = [];

		for (let period = +sub.initialPeriod; period < +sub.expirationDate; period += SUBSCRIPTION_DURATION) {
			periods.push(period);
		}

		const [currentSharePrice, periodShares]: [bigint, Array<bigint>] = await Promise.all([
			contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]),
			client
				.multicall({
					contracts: periods.map((p) => ({ ...subsContract, functionName: "sharesPerPeriod", args: [p] }))
				})
				.then((data: any) => data.map((x: any) => x.result))
		]);

		let subsetAccumulator = 0n;

		periodShares.forEach((shares: any) => {
			const finalShares = !shares || shares === 0n ? currentSharePrice : shares;
			subsetAccumulator += finalShares;
		});

		const balance: bigint = await contract.read.convertToAssets([
			initialShares - (subsetAccumulator * BigInt(sub.amountPerCycle)) / BigInt(SUBSCRIPTION_AMOUNT_DIVISOR)
		]);
		return balance;
	}
}

async function getSubscriptions(address?: string) {
	try {
		if (!address) return null;

		const subs = gql`
		{
			subs(where: { owner: "${address.toLowerCase()}" } orderBy: realExpiration orderDirection: desc ) {
				id
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

export const Unsubscribe = () => {
	const { address } = useAccount();

	const {
		data: subs,
		isLoading: fetchingSubs,
		error: errorFetchingSubs,
		refetch: refetchSubs
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
				<div className="flex flex-col gap-4 overflow-x-auto">
					{subs.map((sub) => (
						<Sub key={sub.id} data={sub} refetchSubs={refetchSubs} />
					))}
				</div>
			)}
		</>
	);
};

const Sub = ({ data, refetchSubs }: { data: IFormattedSub; refetchSubs: () => void }) => {
	const { chain } = useNetwork();

	const {
		data: balance,
		isLoading: fetchingBalance,
		error: errorFetchingBalance,
		refetch: refetchBalance
	} = useQuery(
		["subBalance", data.id],
		() =>
			calculateSubBalance({
				contract,
				client,
				sub: data
			}),
		{ cacheTime: 20_000, refetchInterval: 20_000 }
	);
	const {
		data: unsubscribeTxData,
		write: unsubscribe,
		isLoading: confirmingUnsubscribeTx,
		error: errorConfirmingUnsubscribeTx,
		reset
	} = useContractWrite({
		address: SUB_CHAIN_LIB.contracts.subscriptions,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "unsubscribe",
		args: [
			data.initialPeriod,
			data.expirationDate,
			data.amountPerCycle,
			data.receiver,
			data.accumulator,
			data.initialShares
		],
		chainId: optimism.id
	});

	const {
		data: unsubscribeTxDataOnChain,
		isLoading: waitingForUnsubscribeTxDataOnChain,
		error: errorWaitingForUnsubscribeTxDataOnChain
	} = useWaitForTransaction({
		hash: unsubscribeTxData?.hash,
		enabled: unsubscribeTxData ? true : false,
		chainId: optimism.id,
		onSuccess: (data) => {
			if (data.status === "success") {
				refetchBalance();
				refetchSubs();
				reset();
			}
		}
	});

	const isExpired = +data.realExpiration * 1000 < Date.now();
	const cannotUnsubscribe = +data.realExpiration * 1000 - Date.now() <= data.subDuration;

	return (
		<div className="relative mx-auto flex w-full max-w-[450px] flex-col gap-2 rounded-lg border border-black/5 p-4 dark:border-white/5 xl:-left-[102px]">
			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">Receiver</span>
				<a
					target="_blank"
					rel="noopene noreferrer"
					href={`https://optimistic.etherscan.io/address/${data.receiver}`}
					className="underline"
				>
					{data.receiver.slice(0, 4) + "..." + data.receiver.slice(-4)}
				</a>
			</p>

			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">{isExpired ? "Expired on" : "Expires On"}</span>
				<span>{`${new Date(+data.realExpiration * 1000).toUTCString()}`}</span>
			</p>

			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">Total Paid</span>
				<span className="flex flex-nowrap items-center gap-1">
					<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
					<span>{`${data.totalAmountPaid} DAI`}</span>
				</span>
			</p>

			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">Duration</span>
				<span>{`${data.subDurationFormatted}`}</span>
			</p>

			{!data.unsubscribed && +data.realExpiration * 1000 > Date.now() ? (
				<p className="flex flex-col">
					<span className="text-xs text-[#757575]">Available Balance</span>
					<span className="flex min-h-[1.5rem] flex-nowrap items-center gap-1">
						<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
						{!fetchingBalance && balance ? (
							<span>{`${formatNum(+formatUnits(balance, DAI_OPTIMISM.decimals), 2)} DAI`}</span>
						) : null}
					</span>
				</p>
			) : null}

			{data.unsubscribed ? (
				<button
					className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					disabled
				>
					Unsubscribed
				</button>
			) : isExpired ? (
				<button
					className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					disabled
				>
					Expired
				</button>
			) : (
				<button
					className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					disabled={
						!chain ||
						chain.unsupported ||
						!unsubscribe ||
						confirmingUnsubscribeTx ||
						waitingForUnsubscribeTxDataOnChain ||
						cannotUnsubscribe
					}
					onClick={() => unsubscribe?.()}
				>
					{confirmingUnsubscribeTx || waitingForUnsubscribeTxDataOnChain ? "Confirming..." : "Unsubscribe"}
				</button>
			)}

			{errorFetchingBalance ? (
				<p className="text-center text-sm text-red-500">
					{(errorFetchingBalance as any)?.message ?? "Failed to fetch available balance"}
				</p>
			) : null}

			{errorConfirmingUnsubscribeTx ? (
				<p className="text-center text-sm text-red-500">
					{(errorConfirmingUnsubscribeTx as any)?.shortMessage ?? errorConfirmingUnsubscribeTx.message}
				</p>
			) : null}
			{errorWaitingForUnsubscribeTxDataOnChain ? (
				<p className="text-center text-sm text-red-500">
					{(errorWaitingForUnsubscribeTxDataOnChain as any)?.shortMessage ??
						errorWaitingForUnsubscribeTxDataOnChain.message}
				</p>
			) : null}

			{unsubscribeTxDataOnChain ? (
				unsubscribeTxDataOnChain.status === "success" ? (
					<p className="text-center text-sm text-green-500">Transaction Success</p>
				) : (
					<p className="text-center text-sm text-red-500">Transaction Failed</p>
				)
			) : null}
		</div>
	);
};
