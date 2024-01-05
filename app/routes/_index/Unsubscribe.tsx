import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { formatUnits } from "viem";
import { optimism } from "viem/chains";
import { useContractWrite, useNetwork, useWaitForTransaction } from "wagmi";

import { Icon } from "~/components/Icon";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, SUBSCRIPTION_AMOUNT_DIVISOR, SUBSCRIPTION_DURATION } from "~/lib/constants";
import { type IFormattedSub } from "~/types";
import { formatNum } from "~/utils/formatNum";

import { SUB_CHAIN_LIB, subsContract, contract, client } from "./utils";

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

export const Unsubscribe = ({ data }: { data: IFormattedSub }) => {
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

	const queryClient = useQueryClient();

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
				toast.success("Transaction Success", { id: "tx-success" + data.transactionHash });
				refetchBalance();
				reset();
				queryClient.invalidateQueries();
			} else {
				toast.error("Transaction Failed", { id: "tx-failed" + data.transactionHash });
			}
		}
	});

	const isExpired = +data.realExpiration * 1000 < Date.now();
	const cannotUnsubscribe = +data.realExpiration * 1000 - Date.now() <= data.subDuration;
	const isUnsubscribed = data.unsubscribed || unsubscribeTxDataOnChain?.status === "success" ? true : false;
	if (errorConfirmingUnsubscribeTx) {
		const msg = (errorConfirmingUnsubscribeTx as any)?.shortMessage ?? errorConfirmingUnsubscribeTx.message;
		toast.error(msg, { id: "error-confirming-unsub-tx" + (unsubscribeTxData?.hash ?? "") });
	}
	if (errorWaitingForUnsubscribeTxDataOnChain) {
		const msg =
			(errorWaitingForUnsubscribeTxDataOnChain as any)?.shortMessage ?? errorWaitingForUnsubscribeTxDataOnChain.message;
		toast.error(msg, { id: "error-confirming-unsub-tx" + (unsubscribeTxData?.hash ?? "") });
	}
	return (
		<>
			<td className="p-3 text-center">
				{!isUnsubscribed && +data.realExpiration * 1000 > Date.now() ? (
					<>
						<span className="flex min-h-[1.5rem] flex-nowrap items-center gap-1">
							<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
							{!fetchingBalance && balance ? (
								<span className="whitespace-nowrap">{`${formatNum(
									+formatUnits(balance, DAI_OPTIMISM.decimals),
									2
								)} DAI`}</span>
							) : null}
							{errorFetchingBalance ? (
								<Ariakit.TooltipProvider showTimeout={0}>
									<Ariakit.TooltipAnchor
										render={<Icon name="exclamation-circle" className="h-5 w-5 flex-shrink-0 text-red-500" />}
									/>
									<Ariakit.Tooltip className="max-w-xs cursor-default border border-solid border-black bg-white p-1 text-sm text-black">
										{(errorFetchingBalance as any)?.message ?? "Failed to fetch available balance"}
									</Ariakit.Tooltip>
								</Ariakit.TooltipProvider>
							) : null}
						</span>
					</>
				) : null}
			</td>
			<td className="px-3 py-1">
				{!isUnsubscribed && +data.realExpiration * 1000 > Date.now() ? (
					<Link
						to={`/subscribe?to=${data.receiver}&amount=${formatUnits(
							BigInt(data.amountPerCycle),
							DAI_OPTIMISM.decimals
						)}`}
						className="whitespace-nowrap rounded-lg bg-[#13785a] p-2 text-xs text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					>
						Top up
					</Link>
				) : null}
			</td>
			<td className="px-3 py-1">
				{data.subDurationFormatted === "-" ? null : isUnsubscribed ? null : isExpired ? null : (
					<button
						className="rounded-lg bg-[#13785a] p-2 text-xs text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
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
			</td>
		</>
	);
};
