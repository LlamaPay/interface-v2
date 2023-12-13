import { request, gql } from "graphql-request";
import { formatUnits } from "viem";
import { useAccount, useContractWrite, useNetwork, useQuery, useWaitForTransaction } from "wagmi";

import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, SUBSCRIPTION_AMOUNT_DIVISOR, SUBSCRIPTION_DURATION } from "~/lib/constants";

import { SUB_CHAIN_LIB, subsContract, contract, client } from "./utils";

interface ISub {
	expirationDate: string;
	id: string;
	initialPeriod: string;
	initialShares: string;
	receiver: string;
	startTimestamp: string;
	unsubscribed: boolean;
	amountPerCycle: string;
	realExpiration: string;
	accumulator: string;
}

interface IFormattedSub {
	id: string;
	receiver: string;
	startTimestamp: number;
	unsubscribed: boolean;
	initialShares: number;
	initialPeriod: number;
	expirationDate: number;
	SUBSCRIPTION_DURATION: number;
	fullPeriodStartingTime: number;
	totalAmountPaid: number;
	amountPerCycle: number;
	realExpiration: number;
	subDuration: string;
	accumulator: number;
}

async function calculateSubBalance({ sub, contract, client }: { sub: any; contract: any; client: any }) {
	if (!sub) return null;

	const currentTimestamp = Date.now() / 1e3;

	if (sub.expirationDate > currentTimestamp) {
		// eslint-disable-next-line
		let [sharesAccumulator, currentPeriod] = await Promise.all([
			contract.read.sharesAccumulator(),
			contract.read.currentPeriod()
		]);

		if (Number(currentPeriod.toString()) + SUBSCRIPTION_DURATION < currentTimestamp) {
			const shares = await contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]);
			sharesAccumulator +=
				BigInt(Math.floor((currentTimestamp - Number(currentPeriod.toString())) / SUBSCRIPTION_DURATION)) * shares;
		}

		const sharesPaid =
			((Number(sharesAccumulator.toString()) - sub.accumulator) * sub.amountPerCycle) /
			Number(SUBSCRIPTION_AMOUNT_DIVISOR.toString());

		const sharesLeft = sub.initialShares - sharesPaid;

		const balance = await contract.read.convertToAssets([sharesLeft]);

		return balance;
	} else {
		const periods = [];

		for (let period = sub.initialPeriod; period < sub.expirationDate; period += SUBSCRIPTION_DURATION) {
			periods.push(period);
		}

		const [currentSharePrice, periodShares] = await Promise.all([
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
		const balance = await contract.read.convertToAssets([
			sub.initialShares -
				(Number(subsetAccumulator.toString()) * sub.amountPerCycle) / Number(SUBSCRIPTION_AMOUNT_DIVISOR.toString())
		]);
		return balance;
	}
}

async function getSubscriptions(address?: string) {
	try {
		if (!address) return null;

		const subs = gql`
		{
			subs(where: { owner: "${address.toLowerCase()}" } orderBy: expirationDate orderDirection: desc ) {
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

		return (data.subs ?? []).map((sub) => {
			const id = sub.id;
			const receiver = sub.receiver;
			const startTimestamp = +sub.startTimestamp;
			const unsubscribed = sub.unsubscribed;
			const initialShares = +sub.initialShares;
			const initialPeriod = +sub.initialPeriod;
			const expirationDate = +sub.expirationDate;
			const amountPerCycle = +sub.amountPerCycle;
			const realExpiration = +sub.realExpiration;
			const accumulator = +sub.accumulator;
			const fullPeriodStartingTime = initialPeriod + SUBSCRIPTION_DURATION;
			const partialPeriodTime = fullPeriodStartingTime - startTimestamp;
			const fullCycles = (expirationDate - initialPeriod) / SUBSCRIPTION_DURATION;
			const amountPaidFully = fullCycles * amountPerCycle;
			const partialCycles = partialPeriodTime / SUBSCRIPTION_DURATION;
			const amountPaidPartially = partialCycles * amountPerCycle;

			let subDuration = `${fullCycles} ${SUBSCRIPTION_DURATION === 24 * 60 * 60 ? "days" : "month"}`;

			if (partialCycles) {
				subDuration += `,`;

				const [hours, minutes] = (partialCycles * 24).toString().split(".");

				if (hours) {
					subDuration += ` ${hours} hours`;
				}

				if (minutes) {
					subDuration += ` ${(+minutes * 60).toString().slice(0, 2)} minutes`;
				}
			}

			return {
				id,
				receiver,
				startTimestamp,
				unsubscribed,
				initialShares,
				initialPeriod,
				expirationDate,
				SUBSCRIPTION_DURATION,
				fullPeriodStartingTime,
				totalAmountPaid: +((amountPaidPartially + amountPaidFully) / 10 ** DAI_OPTIMISM.decimals).toFixed(2),
				amountPerCycle,
				realExpiration,
				subDuration,
				accumulator
			} as IFormattedSub;
		});
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
		enabled: address ? true : false,
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
				<ul className="flex flex-col gap-4 overflow-x-auto">
					{subs.map((sub) => (
						<Sub key={sub.id} data={sub} refetchSubs={refetchSubs} />
					))}
				</ul>
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
		error: errorConfirmingUnsubscribeTx
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
		]
	});

	const {
		data: unsubscribeTxDataOnChain,
		isLoading: waitingForUnsubscribeTxDataOnChain,
		error: errorWaitingForUnsubscribeTxDataOnChain
	} = useWaitForTransaction({
		hash: unsubscribeTxData?.hash,
		enabled: unsubscribeTxData ? true : false,
		onSuccess: (data) => {
			if (data.status === "success") {
				refetchBalance();
				refetchSubs();
			}
		}
	});

	return (
		<li className="flex flex-col gap-2 rounded-lg border border-black/5 p-4 dark:border-white/5">
			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">Receiver</span>
				<a target="_blank" rel="noopene noreferrer" href={`https://optimistic.etherscan.io/address/${data.receiver}`}>
					{data.receiver.slice(0, 4) + "..." + data.receiver.slice(-4)}
				</a>
			</p>

			<p className="flex flex-col">
				<span className="text-xs text-[#757575]">
					{data.expirationDate * 1000 < new Date().getTime() ? "Expired on" : "Expires On"}
				</span>
				<span>{`${new Date(data.expirationDate * 1000).toLocaleString()}`}</span>
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
				<span>{`${data.subDuration}`}</span>
			</p>

			{!data.unsubscribed && data.expirationDate * 1000 > new Date().getTime() ? (
				<p className="flex flex-col">
					<span className="text-xs text-[#757575]">Available Balance</span>
					<span className="flex min-h-[1.5rem] flex-nowrap items-center gap-1">
						<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
						{!fetchingBalance && balance ? <span>{`${formatUnits(balance, DAI_OPTIMISM.decimals)} DAI`}</span> : null}
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
			) : data.expirationDate * 1000 < new Date().getTime() ? (
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
						!chain || chain.unsupported || !unsubscribe || confirmingUnsubscribeTx || waitingForUnsubscribeTxDataOnChain
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
					<p className="text-center text-sm text-green-500">Transsaction Success</p>
				) : (
					<p className="text-center text-sm text-red-500">Transaction Failed</p>
				)
			) : null}
		</li>
	);
};
