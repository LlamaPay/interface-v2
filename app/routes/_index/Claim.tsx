import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
	http,
	createPublicClient,
	formatUnits,
	getContract,
	parseUnits,
} from "viem";
import { optimism } from "viem/chains";
import {
	useAccount,
	useContractWrite,
	useNetwork,
	useWaitForTransaction,
} from "wagmi";

import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import {
	DAI_OPTIMISM,
	LLAMAPAY_CHAINS_LIB,
	SUBSCRIPTION_AMOUNT_DIVISOR,
	SUBSCRIPTION_DURATION,
} from "~/lib/constants";
import { formatNum } from "~/utils/formatNum";

import { Icon } from "~/components/Icon";

const SUB_CHAIN_LIB = LLAMAPAY_CHAINS_LIB[optimism.id];
const client = createPublicClient({
	chain: optimism,
	transport: http(SUB_CHAIN_LIB.rpc),
});

const min = (a: bigint, b: bigint) => (a > b ? b : a);

async function calculateAvailableToClaim({
	subsContract,
	receiver,
}: {
	subsContract: `0x${string}`;
	receiver?: string;
}) {
	if (!receiver) return null;

	const contract: any = getContract({
		address: subsContract,
		abi: SUBSCRIPTIONS_ABI,
		publicClient: client as any,
	});

	try {
		const currentTimestamp = Math.floor(Date.now() / 1e3);

		const receiverBalance = await contract.read.receiverBalances([receiver]);

		// eslint-disable-next-line
		let [balance, amountPerPeriod, lastUpdate]: [bigint, bigint, bigint] =
			receiverBalance;

		const periodBoundary =
			BigInt(currentTimestamp) - BigInt(SUBSCRIPTION_DURATION);

		if (lastUpdate <= BigInt(periodBoundary) && lastUpdate !== 0n) {
			const periods = [];
			for (
				let period = lastUpdate;
				period <= periodBoundary;
				period += BigInt(SUBSCRIPTION_DURATION)
			) {
				periods.push(period);
			}

			const [currentSharePrice, periodShares, receiverAmountToExpire] =
				await Promise.all([
					contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]),
					client
						.multicall({
							contracts: periods.map((p) => ({
								address: subsContract,
								abi: SUBSCRIPTIONS_ABI,
								functionName: "sharesPerPeriod",
								args: [p],
							})),
						})
						.then((data: any) => data.map((x: any) => x.result)),
					client
						.multicall({
							contracts: periods.map((p) => ({
								address: subsContract,
								abi: SUBSCRIPTIONS_ABI,
								functionName: "receiverAmountToExpire",
								args: [receiver, p],
							})),
						})
						.then((data: any) => data.map((x: any) => x.result)),
				]);

			periodShares.forEach((shares: any, i: number) => {
				const finalShares =
					!shares || shares === 0n ? currentSharePrice : shares;
				amountPerPeriod -= receiverAmountToExpire[i] ?? 0n;
				balance +=
					BigInt(amountPerPeriod * finalShares) /
					BigInt(SUBSCRIPTION_AMOUNT_DIVISOR);
			});
		}

		const claimable: bigint = await contract.read.convertToAssets([balance]);

		return claimable;
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Failed to fetch claimables",
		);
	}
}

async function calculateAvailableToClaimNextMonth({
	subsContract,
	receiver,
}: {
	subsContract: `0x${string}`;
	receiver?: string;
}) {
	if (!receiver) return null;
	try {
		const contract: any = getContract({
			address: subsContract as `0x${string}`,
			abi: SUBSCRIPTIONS_ABI,
			publicClient: client as any,
		});

		const receiverBalance = await contract.read.receiverBalances([receiver]);
		// eslint-disable-next-line
		const [balance, amountPerPeriod, lastUpdate]: [bigint, bigint, bigint] =
			receiverBalance;
		if (lastUpdate === 0n) {
			return 0n;
		}
		let currentPeriod: bigint = await contract.read.currentPeriod();

		let totalForNextMonth = amountPerPeriod;
		while (currentPeriod < Date.now() / 1e3) {
			totalForNextMonth -= await contract.read.receiverAmountToExpire([
				receiver,
				currentPeriod,
			]);
			currentPeriod += BigInt(SUBSCRIPTION_DURATION);
		}
		return totalForNextMonth;
	} catch (error) {
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to fetch claimables next month",
		);
	}
}

async function calcAvailableToClaimOnAllContracts({
	receiver,
}: {
	receiver?: string;
}) {
	try {
		const data = await Promise.allSettled([
			calculateAvailableToClaimNextMonth({
				subsContract:
					LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions_v1,
				receiver,
			}),
			calculateAvailableToClaimNextMonth({
				subsContract: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
				receiver,
			}),
		]);

		const claimables_v1 = data[0].status === "fulfilled" ? data[0].value : null;
		const claimables_v2 = data[1].status === "fulfilled" ? data[1].value : null;

		return {
			claimables_v1,
			claimables_v2,
			total:
				typeof claimables_v1 === "bigint" || typeof claimables_v2 === "bigint"
					? (claimables_v1 ?? 0n) + (claimables_v2 ?? 0n)
					: null,
		};
	} catch (error) {
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to fetch claimables next month",
		);
	}
}

async function calcAvailableToClaimNextMonthOnAllContracts({
	receiver,
}: {
	receiver?: string;
}) {
	try {
		const data = await Promise.allSettled([
			calculateAvailableToClaim({
				subsContract:
					LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions_v1,
				receiver,
			}),
			calculateAvailableToClaim({
				subsContract: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
				receiver,
			}),
		]);

		const claimables_v1 = data[0].status === "fulfilled" ? data[0].value : null;
		const claimables_v2 = data[1].status === "fulfilled" ? data[1].value : null;

		return {
			claimables_v1,
			claimables_v2,
			total:
				typeof claimables_v1 === "bigint" || typeof claimables_v2 === "bigint"
					? (claimables_v1 ?? 0n) + (claimables_v2 ?? 0n)
					: null,
		};
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Failed to fetch claimables",
		);
	}
}

export const Claim = () => {
	const { address, isConnected } = useAccount();
	const { chain } = useNetwork();
	const {
		data: claimTxData_v1,
		writeAsync: claim_v1,
		isLoading: confirmingClaimTx_v1,
	} = useContractWrite({
		address: SUB_CHAIN_LIB.contracts.subscriptions_v1,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "claim",
		chainId: optimism.id,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-claim-tx${claimTxData_v1?.hash ?? ""}`,
			});
		},
	});
	const {
		data: claimTxData_v2,
		writeAsync: claim_v2,
		isLoading: confirmingClaimTx_v2,
	} = useContractWrite({
		address: SUB_CHAIN_LIB.contracts.subscriptions,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "claim",
		chainId: optimism.id,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-claim-tx${claimTxData_v2?.hash ?? ""}`,
			});
		},
	});
	const { isLoading: waitingForClaimTxDataOnChain_v1 } = useWaitForTransaction({
		hash: claimTxData_v1?.hash,
		enabled: claimTxData_v1 ? true : false,
		chainId: optimism.id,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-claim-tx-on-chain${claimTxData_v1?.hash ?? ""}`,
			});
		},
		onSuccess: (data) => {
			if (data.status === "success") {
				toast.success("Transaction Success", {
					id: `tx-success-${data.transactionHash}`,
				});
			} else {
				toast.error("Transaction Failed", {
					id: `tx-failed-${data.transactionHash}`,
				});
			}
		},
	});
	const { isLoading: waitingForClaimTxDataOnChain_v2 } = useWaitForTransaction({
		hash: claimTxData_v2?.hash,
		enabled: claimTxData_v2 ? true : false,
		chainId: optimism.id,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-claim-tx-on-chain${claimTxData_v2?.hash ?? ""}`,
			});
		},
		onSuccess: (data) => {
			if (data.status === "success") {
				toast.success("Transaction Success", {
					id: `tx-success-${data.transactionHash}`,
				});
			} else {
				toast.error("Transaction Failed", {
					id: `tx-failed-${data.transactionHash}`,
				});
			}
		},
	});

	const {
		data: claimable,
		isLoading: fetchingClaimables,
		error: errorFetchingClaimables,
		refetch: refetchClaimable,
	} = useQuery(
		["claimable", address],
		() =>
			calcAvailableToClaimNextMonthOnAllContracts({
				receiver: address,
			}),
		{ refetchInterval: 20_000 },
	);
	const { data: claimableNextMonth, isLoading: fetchingClaimablesNextMonth } =
		useQuery(
			["claimable-next-month", address],
			() =>
				calcAvailableToClaimOnAllContracts({
					receiver: address,
				}),
			{ refetchInterval: 20_000 },
		);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;

		if (
			!address ||
			!chain ||
			chain.id !== optimism.id ||
			!claimable ||
			!claimable.total
		)
			return;

		let toClaim = parseUnits(form.amountToClaim.value, DAI_OPTIMISM.decimals);

		if (claimable.claimables_v1 && claimable.claimables_v1 > 0) {
			const contract: any = getContract({
				address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions_v1,
				abi: SUBSCRIPTIONS_ABI,
				publicClient: client as any,
			});

			const shares = await contract.read.convertToShares([toClaim]);

			await claim_v1?.({
				args: [min(min(toClaim, claimable.claimables_v1), shares)],
			});

			toClaim -= claimable.claimables_v1;
		}

		if (claimable.claimables_v2 && claimable.claimables_v2 > 0 && toClaim > 0) {
			const contract: any = getContract({
				address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
				abi: SUBSCRIPTIONS_ABI,
				publicClient: client as any,
			});
			const shares = await contract.read.convertToShares([toClaim]);

			await claim_v2?.({
				args: [min(toClaim, shares)],
			});
		}

		form.reset();
		refetchClaimable();
	};
	const [amountToClaim, setAmountToClaim] = useState("");
	const hydrated = useHydrated();

	const amountToClaimParsed =
		amountToClaim !== ""
			? parseUnits(amountToClaim, DAI_OPTIMISM.decimals)
			: 0n;

	const needToClaimTwoTxs =
		amountToClaim !== "" &&
		claimable &&
		claimable.claimables_v1 &&
		claimable.total &&
		amountToClaimParsed > claimable.claimables_v1 &&
		amountToClaimParsed <= claimable.total
			? true
			: false;

	return (
		<>
			<form
				className="relative mx-auto flex w-full max-w-[450px] flex-col gap-4 xl:-left-[102px]"
				onSubmit={handleSubmit}
			>
				<label className="flex flex-col gap-1">
					<span>Amount</span>

					<span className="relative isolate rounded-lg border border-black/[0.15] bg-[#ffffff] p-3 pb-[26px] dark:border-white/5 dark:bg-[#141414]">
						<input
							name="amountToClaim"
							className="relative z-10 w-full border-none bg-transparent pr-16 text-4xl !outline-none"
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
							disabled={
								confirmingClaimTx_v1 ||
								confirmingClaimTx_v2 ||
								waitingForClaimTxDataOnChain_v1 ||
								waitingForClaimTxDataOnChain_v2
							}
						/>
						<span className="absolute bottom-0 right-4 top-3 my-auto flex flex-col gap-2">
							<p className="ml-auto flex items-center gap-1 text-xl">
								<img src={DAI_OPTIMISM.img} width={16} height={16} alt="" />
								<span>DAI</span>
							</p>
							<p className="flex items-center gap-1 text-xs">
								<span>Claimable:</span>
								{!hydrated || fetchingClaimables ? (
									<span className="inline-block h-4 w-8 animate-pulse rounded bg-gray-400" />
								) : !isConnected || errorFetchingClaimables ? (
									<span>-</span>
								) : (
									<>
										<span>
											{typeof claimable?.total === "bigint"
												? formatNum(
														formatUnits(claimable.total, DAI_OPTIMISM.decimals),
														2,
												  )
												: "-"}
										</span>

										<button
											type="button"
											className="text-[var(--page-text-color-2)] underline"
											onClick={() =>
												setAmountToClaim(
													claimable?.total
														? formatUnits(
																claimable.total,
																DAI_OPTIMISM.decimals,
														  )
														: "0",
												)
											}
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

				<p className="flex items-center gap-1 text-xs">
					<span>Claimable Next Month:</span>
					{!hydrated || fetchingClaimablesNextMonth ? (
						<span className="inline-block h-4 w-8 animate-pulse rounded bg-gray-400" />
					) : !isConnected || errorFetchingClaimables ? (
						<span>-</span>
					) : (
						<span>
							{typeof claimableNextMonth?.total === "bigint"
								? `${formatNum(
										formatUnits(
											claimableNextMonth.total,
											DAI_OPTIMISM.decimals,
										),
										2,
								  )} DAI`
								: "-"}
						</span>
					)}
				</p>

				<button
					className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					disabled={
						!hydrated ||
						!address ||
						!chain ||
						chain.id !== optimism.id ||
						confirmingClaimTx_v1 ||
						waitingForClaimTxDataOnChain_v1 ||
						confirmingClaimTx_v2 ||
						waitingForClaimTxDataOnChain_v2 ||
						!claimable?.total ||
						amountToClaimParsed > claimable.total
					}
				>
					{confirmingClaimTx_v1 ||
					waitingForClaimTxDataOnChain_v1 ||
					confirmingClaimTx_v2 ||
					waitingForClaimTxDataOnChain_v2
						? "Confirming..."
						: "Claim"}
				</button>

				{needToClaimTwoTxs ? (
					<p className="flex items-center justify-center gap-1 flex-nowrap text-orange-500 text-sm text-center">
						<Icon name="exclamation-circle" className="h-5 w-5 flex-shrink-0" />
						<span>You need to confirm two transactions on your wallet</span>
					</p>
				) : null}
			</form>
		</>
	);
};
