import { useQuery } from "@tanstack/react-query";
import { parseUnits, formatUnits } from "viem";
import { optimism } from "viem/chains";
import { useAccount, useContractWrite, useNetwork, useWaitForTransaction } from "wagmi";

import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, SUBSCRIPTION_AMOUNT_DIVISOR, SUBSCRIPTION_DURATION } from "~/lib/constants";

import { SUB_CHAIN_LIB, subsContract, contract, client } from "./utils";

const min = (a: bigint, b: bigint) => (a > b ? b : a);

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

	const currentTimestamp = new Date().getTime() / 1000;

	const receiverBalance = await contract.read.receiverBalances([receiver]);

	// eslint-disable-next-line
	let [balance, amountPerPeriod, lastUpdate] = receiverBalance;

	const periodBoundary = currentTimestamp - SUBSCRIPTION_DURATION;

	if (lastUpdate <= periodBoundary && lastUpdate != 0n) {
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
			balance += BigInt(amountPerPeriod * finalShares) / SUBSCRIPTION_AMOUNT_DIVISOR;
		});
	}

	const claimable = await contract.read.convertToAssets([balance]);

	return claimable;
}

export const Claim = () => {
	const { address } = useAccount();
	const { chain } = useNetwork();
	const {
		data: claimTxData,
		write: claim,
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
		error: errorFetchingClaimables
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

		claim?.({
			args: [min(claimable, shares)]
		});
	};

	const hydrated = useHydrated();

	return (
		<>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<label className="flex flex-col gap-1">
					<span>Amount</span>
					<input
						name="amountToClaim"
						className="peer w-full rounded-lg border border-black/[0.15] bg-[#ffffff] p-3 dark:border-white/5 dark:bg-[#141414] invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500"
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
					/>

					<p className="flex items-center gap-1 rounded-lg border border-black/[0.05] p-3 text-sm dark:border-white/5">
						<span>Claimable:</span>
						{!hydrated || fetchingClaimables ? (
							<span className="inline-block h-4 w-[10ch] animate-pulse rounded bg-gray-400"></span>
						) : !errorFetchingClaimables ? (
							<>
								<img src={DAI_OPTIMISM.img} width={14} height={14} alt="" />
								<span>{(claimable ? formatUnits(claimable, DAI_OPTIMISM.decimals) : "0") + " DAI"}</span>
							</>
						) : null}
					</p>

					{hydrated && errorFetchingClaimables ? (
						<p className="text-center text-sm text-red-500">
							{(errorFetchingClaimables as any)?.shortMessage ??
								(errorFetchingClaimables as any).message ??
								"Failed to fetch amount claimable"}
						</p>
					) : null}

					<span className="mt-1 hidden text-xs text-red-500 peer-[&:not(:placeholder-shown):not(:focus):invalid]:block">
						Enter numbers only
					</span>
				</label>

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

				{errorConfirmingClaimTx ? (
					<p className="text-center text-sm text-red-500">
						{(errorConfirmingClaimTx as any)?.shortMessage ?? errorConfirmingClaimTx.message}
					</p>
				) : null}
				{errorWaitingForClaimTxDataOnChain ? (
					<p className="text-center text-sm text-red-500">
						{(errorWaitingForClaimTxDataOnChain as any)?.shortMessage ?? errorWaitingForClaimTxDataOnChain.message}
					</p>
				) : null}

				{claimTxDataOnChain ? (
					claimTxDataOnChain.status === "success" ? (
						<p className="text-center text-sm text-green-500">Transsaction Success</p>
					) : (
						<p className="text-center text-sm text-red-500">Transaction Failed</p>
					)
				) : null}
			</form>
		</>
	);
};
