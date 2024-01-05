import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { parseUnits, formatUnits } from "viem";
import { optimism } from "viem/chains";
import { useAccount, useContractWrite, useNetwork, useWaitForTransaction } from "wagmi";

import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, SUBSCRIPTION_AMOUNT_DIVISOR, SUBSCRIPTION_DURATION } from "~/lib/constants";

import { SUB_CHAIN_LIB, subsContract, contract, client } from "./utils";

const min = (a: bigint, b: bigint) => (a > b ? b : a);
// TODO calculate available to claim next month
async function calculateAvailableToClaim({
	receiver,
	contract,
	client
}: {
	receiver?: string;
	contract: any;
	client: any;
}) {
	if (!receiver) return null;

	const currentTimestamp = Math.floor(Date.now() / 1e3);

	const receiverBalance = await contract.read.receiverBalances([receiver]);

	// eslint-disable-next-line
	let [balance, amountPerPeriod, lastUpdate]: [bigint, bigint, bigint] = receiverBalance;

	const periodBoundary = BigInt(currentTimestamp) - BigInt(SUBSCRIPTION_DURATION);

	if (lastUpdate <= BigInt(periodBoundary) && lastUpdate != 0n) {
		const periods = [];
		for (let period = lastUpdate; period <= periodBoundary; period += BigInt(SUBSCRIPTION_DURATION)) {
			periods.push(period);
		}

		const [currentSharePrice, periodShares, receiverAmountToExpire] = await Promise.all([
			contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]),
			client
				.multicall({
					contracts: periods.map((p) => ({ ...subsContract, functionName: "sharesPerPeriod", args: [p] }))
				})
				.then((data: any) => data.map((x: any) => x.result)),
			client
				.multicall({
					contracts: periods.map((p) => ({
						...subsContract,
						functionName: "receiverAmountToExpire",
						args: [receiver, p]
					}))
				})
				.then((data: any) => data.map((x: any) => x.result))
		]);

		periodShares.forEach((shares: any, i: number) => {
			const finalShares = !shares || shares === 0n ? currentSharePrice : shares;
			amountPerPeriod -= receiverAmountToExpire[i] ?? 0n;
			balance += BigInt(amountPerPeriod * finalShares) / BigInt(SUBSCRIPTION_AMOUNT_DIVISOR);
		});
	}

	const claimable: bigint = await contract.read.convertToAssets([balance]);

	return claimable;
}

export const Claim = () => {
	const { address, isConnected } = useAccount();
	const { chain } = useNetwork();
	const {
		data: claimTxData,
		writeAsync: claim,
		isLoading: confirmingClaimTx,
		error: errorConfirmingClaimTx
	} = useContractWrite({
		address: SUB_CHAIN_LIB.contracts.subscriptions,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "claim",
		chainId: optimism.id
	});
	const {
		data: claimTxDataOnChain,
		isLoading: waitingForClaimTxDataOnChain,
		error: errorWaitingForClaimTxDataOnChain
	} = useWaitForTransaction({
		hash: claimTxData?.hash,
		enabled: claimTxData ? true : false,
		chainId: optimism.id
	});

	const {
		data: claimable,
		isLoading: fetchingClaimables,
		error: errorFetchingClaimables,
		refetch: refetchClaimable
	} = useQuery(
		["claimable", address],
		() =>
			calculateAvailableToClaim({
				receiver: address,
				contract,
				client
			}),
		{ cacheTime: 20_000, refetchInterval: 20_000 }
	);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;

		if (!address || !chain || chain.id !== optimism.id || !claimable) return;

		const shares = await contract.read.convertToShares([parseUnits(form.amountToClaim.value, DAI_OPTIMISM.decimals)]);

		await claim?.({
			args: [min(claimable, shares)]
		});

		form.reset();
		refetchClaimable();
	};
	const [amountToClaim, setAmountToClaim] = useState("");
	const hydrated = useHydrated();
	if (errorConfirmingClaimTx) {
		const msg = (errorConfirmingClaimTx as any)?.shortMessage ?? errorConfirmingClaimTx.message;
		toast.error(msg, { id: "error-confirming-unsub-tx" + (claimTxData?.hash ?? "") });
	}
	if (errorWaitingForClaimTxDataOnChain) {
		const msg = (errorWaitingForClaimTxDataOnChain as any)?.shortMessage ?? errorWaitingForClaimTxDataOnChain.message;
		toast.error(msg, { id: "error-confirming-unsub-tx" + (claimTxData?.hash ?? "") });
	}
	if (claimTxDataOnChain) {
		if (claimTxDataOnChain.status === "success") {
			toast.success("Transaction Success", { id: "tx-success" + claimTxDataOnChain.transactionHash });
		} else {
			toast.error("Transaction Failed", { id: "tx-failed" + claimTxDataOnChain.transactionHash });
		}
	}

	return (
		<>
			<form
				className="relative mx-auto flex w-full max-w-[450px] flex-col gap-4 xl:-left-[102px]"
				onSubmit={handleSubmit}
			>
				<label className="flex flex-col gap-1">
					<span>Amount</span>

					<span
						className={`relative isolate rounded-lg border border-black/[0.15] bg-[#ffffff] p-3 pb-[26px] dark:border-white/5 dark:bg-[#141414]`}
					>
						<input
							name="amountToClaim"
							className={`relative z-10 w-full border-none bg-transparent pr-16 text-4xl !outline-none`}
							required
							autoComplete="off"
							autoCorrect="off"
							type="text"
							pattern="^[0-9]*[.,]?[0-9]*$"
							placeholder="0.0"
							minLength={1}
							maxLength={79}
							spellCheck="false"
							inputMode="decimal"
							title="Enter numbers only."
							value={amountToClaim}
							onChange={(e) => {
								if (!Number.isNaN(Number(e.target.value))) {
									setAmountToClaim(e.target.value.trim());
								}
							}}
							disabled={confirmingClaimTx || waitingForClaimTxDataOnChain}
						/>
						<span className="absolute bottom-0 right-4 top-3 my-auto flex flex-col gap-2">
							<p className={`ml-auto flex items-center gap-1 text-xl`}>
								<img src={DAI_OPTIMISM.img} width={16} height={16} alt="" />
								<span>DAI</span>
							</p>
							<p className={`flex items-center gap-1 text-xs`}>
								<span>Claimable:</span>
								{!hydrated || fetchingClaimables ? (
									<span className="inline-block h-4 w-8 animate-pulse rounded bg-gray-400"></span>
								) : !isConnected || errorFetchingClaimables ? (
									<span>-</span>
								) : (
									<>
										<span>{claimable ? formatUnits(claimable, DAI_OPTIMISM.decimals) : "0"}</span>

										<button
											type="button"
											className="text-[var(--page-text-color-2)] underline"
											onClick={() => setAmountToClaim(claimable ? formatUnits(claimable, DAI_OPTIMISM.decimals) : "0")}
										>
											Max
										</button>
									</>
								)}
							</p>
						</span>
					</span>
				</label>

				{hydrated && errorFetchingClaimables ? (
					<p className="text-center text-sm text-red-500">
						{(errorFetchingClaimables as any)?.shortMessage ??
							(errorFetchingClaimables as any).message ??
							"Failed to fetch amount claimable"}
					</p>
				) : null}
				<button
					className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					disabled={
						!hydrated ||
						!address ||
						!chain ||
						chain.id !== optimism.id ||
						confirmingClaimTx ||
						waitingForClaimTxDataOnChain
					}
				>
					{confirmingClaimTx || waitingForClaimTxDataOnChain ? "Confirming..." : "Claim"}
				</button>
			</form>
		</>
	);
};
