import * as Ariakit from "@ariakit/react";
import { Link } from "@remix-run/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
	http,
	createPublicClient,
	encodeFunctionData,
	formatUnits,
	getContract,
	parseUnits,
} from "viem";
import {
	erc20ABI,
	useAccount,
	useContractRead,
	useContractWrite,
	useNetwork,
	useWaitForTransaction,
} from "wagmi";

import { Icon } from "~/components/Icon";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import {
	DAI_OPTIMISM,
	LLAMAPAY_CHAINS_LIB,
	SUBSCRIPTION_AMOUNT_DIVISOR,
	SUBSCRIPTION_DURATION,
} from "~/lib/constants";
import { supportedChains } from "~/lib/wallet";
import { type IFormattedSub } from "~/types";
import { formatNum } from "~/utils/formatNum";

export async function calculateSubBalance(sub: IFormattedSub) {
	if (!sub) return null;

	const supportedChain = supportedChains.find(
		(chain) => chain.id === sub.chainId,
	);

	if (!supportedChain) return null;

	const client = createPublicClient({
		chain: supportedChain,
		transport: http((LLAMAPAY_CHAINS_LIB as any)[sub.chainId].rpc),
	});

	const contract: any = getContract({
		address: sub.subsContract as `0x${string}`,
		abi: SUBSCRIPTIONS_ABI,
		publicClient: client as any,
	});

	const initialShares = BigInt(sub.initialShares);

	const currentTimestamp = BigInt(Math.floor(Date.now() / 1e3));

	if (+sub.expirationDate > currentTimestamp) {
		// eslint-disable-next-line
		let [sharesAccumulator, currentPeriod]: [bigint, bigint] =
			await Promise.all([
				contract.read.sharesAccumulator(),
				contract.read.currentPeriod(),
			]);

		if (currentPeriod + BigInt(SUBSCRIPTION_DURATION) < currentTimestamp) {
			const shares: bigint = await contract.read.convertToShares([
				SUBSCRIPTION_AMOUNT_DIVISOR,
			]);
			sharesAccumulator +=
				((currentTimestamp - BigInt(currentPeriod)) /
					BigInt(SUBSCRIPTION_DURATION)) *
				shares;
		}

		const sharesPaid =
			((sharesAccumulator - BigInt(sub.accumulator)) *
				BigInt(sub.amountPerCycle)) /
			BigInt(SUBSCRIPTION_AMOUNT_DIVISOR);

		const sharesLeft = initialShares - sharesPaid;

		const balance: bigint = await contract.read.convertToAssets([sharesLeft]);

		return balance;
	}

	const periods = [];

	for (
		let period = +sub.initialPeriod;
		period < +sub.expirationDate;
		period += SUBSCRIPTION_DURATION
	) {
		periods.push(period);
	}

	const [currentSharePrice, periodShares]: [bigint, Array<bigint>] =
		await Promise.all([
			contract.read.convertToShares([SUBSCRIPTION_AMOUNT_DIVISOR]),
			client
				.multicall({
					contracts: periods.map((p) => ({
						address: sub.subsContract as `0x${string}`,
						abi: SUBSCRIPTIONS_ABI,
						functionName: "sharesPerPeriod",
						args: [p],
					})),
				})
				.then((data: any) => data.map((x: any) => x.result)),
		]);

	let subsetAccumulator = 0n;

	for (const shares of periodShares) {
		const finalShares = !shares || shares === 0n ? currentSharePrice : shares;
		subsetAccumulator += finalShares;
	}

	const balance: bigint = await contract.read.convertToAssets([
		initialShares -
			(subsetAccumulator * BigInt(sub.amountPerCycle)) /
				BigInt(SUBSCRIPTION_AMOUNT_DIVISOR),
	]);
	return balance;
}

export const ManageSub = ({ data }: { data: IFormattedSub }) => {
	const { address } = useAccount();
	const { chain } = useNetwork();
	const queryClient = useQueryClient();

	const {
		data: balance,
		isLoading: fetchingBalance,
		error: errorFetchingBalance,
		refetch: refetchBalance,
	} = useQuery(["subBalance", data.id], () => calculateSubBalance(data), {
		refetchInterval: 20_000,
	});

	// UNSUBSCRIBE
	const {
		data: unsubscribeTxData,
		write: unsubscribe,
		isLoading: confirmingUnsubscribeTx,
		reset,
	} = useContractWrite({
		address: data.subsContract as `0x${string}`,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "unsubscribe",
		args: [
			BigInt(data.initialPeriod),
			BigInt(data.expirationDate),
			BigInt(data.amountPerCycle),
			data.receiver as `0x${string}`,
			BigInt(data.accumulator),
			BigInt(data.initialShares),
		],
		chainId: data.chainId,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-unsub-tx${unsubscribeTxData?.hash ?? ""}`,
			});
		},
	});
	const {
		data: unsubscribeTxDataOnChain,
		isLoading: waitingForUnsubscribeTxDataOnChain,
	} = useWaitForTransaction({
		hash: unsubscribeTxData?.hash,
		enabled: unsubscribeTxData ? true : false,
		chainId: data.chainId,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-unsub-tx-on-chain${
					unsubscribeTxData?.hash ?? ""
				}`,
			});
		},
		onSuccess: (data) => {
			if (data.status === "success") {
				toast.success("Transaction Success", {
					id: `tx-success${data.transactionHash}`,
				});
				refetchBalance();
				reset();
				queryClient.invalidateQueries();
			} else {
				toast.error("Transaction Failed", {
					id: `tx-failed${data.transactionHash}`,
				});
			}
		},
	});

	const isExpired = +data.realExpiration * 1000 < Date.now();
	const cannotUnsubscribe =
		+data.realExpiration * 1000 - Date.now() <= data.subDuration;
	const isUnsubscribed =
		data.unsubscribed || unsubscribeTxDataOnChain?.status === "success"
			? true
			: false;

	// WITHDRAWALS
	const withdrawDialog = Ariakit.useDialogStore({ animated: true });
	const {
		data: withdrawTxData,
		write: withdrawBalanceFromSub,
		isLoading: confirmingWithdrawal,
		error: errorConfirmingWithdrawal,
	} = useContractWrite({
		address: data.subsContract as `0x${string}`,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "batch",
		chainId: data.chainId,
		onError: (err) => {
			const msg = (err as any)?.shortMessage ?? err.message;
			toast.error(msg, {
				id: `error-confirming-withdraw-tx${withdrawTxData?.hash ?? ""}`,
			});
		},
	});
	const {
		data: withdrawTxDataOnChain,
		isLoading: confirmingWithdrawalTxOnChain,
		error: errorConfirmingWithdrawTxDataOnChain,
	} = useWaitForTransaction({
		hash: withdrawTxData?.hash,
		enabled: withdrawTxData ? true : false,
		chainId: data.chainId,
		onSuccess: (data) => {
			if (data.status === "success") {
				toast.success("Transaction Success", {
					id: `tx-success${data.transactionHash}`,
				});
				refetchBalance();
				reset();
				queryClient.invalidateQueries();
				withdrawDialog.toggle();
			}
		},
	});

	const [amountToWithdraw, setAmountToWithdraw] = useState("");
	const amountToDeposit =
		(balance ?? 0n) - parseUnits(amountToWithdraw, DAI_OPTIMISM.decimals);
	const disableWithdrawal = amountToDeposit < 0n;

	const handleWithdrawal = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const unsusbcribe = encodeFunctionData({
			abi: SUBSCRIPTIONS_ABI,
			functionName: "unsubscribe",
			args: [
				BigInt(data.initialPeriod),
				BigInt(data.expirationDate),
				BigInt(data.amountPerCycle),
				data.receiver as `0x${string}`,
				BigInt(data.accumulator),
				BigInt(data.initialShares),
			],
		});

		const calls = [unsusbcribe];

		if (amountToDeposit > 0n) {
			const subscribeForNextPeriod = encodeFunctionData({
				abi: SUBSCRIPTIONS_ABI,
				functionName: "subscribeForNextPeriod",
				args: [
					data.receiver as `0x${string}`,
					BigInt(data.amountPerCycle),
					amountToDeposit,
					0n,
				],
			});
			calls.push(subscribeForNextPeriod);
		}

		withdrawBalanceFromSub?.({ args: [calls, true] });
	};

	// TOKEN APPROVAL
	// get current DAI allowance of user
	const {
		data: allowance,
		error: errorFetchingAllowance,
		refetch: refetchAllowance,
	} = useContractRead({
		address: DAI_OPTIMISM.address,
		abi: erc20ABI,
		functionName: "allowance",
		args: address && [address, data.subsContract as `0x${string}`],
		enabled: address ? true : false,
		chainId: data.chainId,
	});

	// check if input amount is gte to allowance
	const isApproved =
		amountToDeposit > 0n
			? allowance
				? allowance >= amountToDeposit
				: false
			: true;

	const {
		data: approveTxData,
		write: approveToken,
		isLoading: confirmingTokenApproval,
		error: errorConfirmingTokenApproval,
	} = useContractWrite({
		address: DAI_OPTIMISM.address,
		abi: erc20ABI,
		functionName: "approve",
		chainId: data.chainId,
	});
	const {
		data: approveTxDataOnChain,
		isLoading: waitingForApproveTxConfirmation,
		error: errorConfirmingApproveTx,
	} = useWaitForTransaction({
		hash: approveTxData?.hash,
		enabled: approveTxData ? true : false,
		chainId: data.chainId,
		onSuccess(data) {
			if (data.status === "success") {
				refetchAllowance();
			}
		},
	});

	// Hide table cells if sub expired/cancelled/unsubscribed
	if (isUnsubscribed) {
		return (
			<>
				<td className="p-3 text-center" />
				<td className="p-3 text-center" />
				<td className="p-3 text-center" />
				<td className="p-3 text-center" />
			</>
		);
	}

	return (
		<>
			<td className="p-3 text-center">
				<span className="flex min-h-[1.5rem] flex-nowrap items-center gap-1">
					{!fetchingBalance && balance ? (
						<>
							<img src={DAI_OPTIMISM.img} alt="" width={16} height={16} />
							<span className="whitespace-nowrap">{`${formatNum(
								+formatUnits(balance, DAI_OPTIMISM.decimals),
								2,
							)} DAI`}</span>
						</>
					) : null}
					{errorFetchingBalance ? (
						<Ariakit.TooltipProvider showTimeout={0}>
							<Ariakit.TooltipAnchor
								render={
									<Icon
										name="exclamation-circle"
										className="h-5 w-5 flex-shrink-0 text-red-500"
									/>
								}
							/>
							<Ariakit.Tooltip className="break-all max-w-xs cursor-default border border-solid border-black bg-white p-1 text-sm text-black">
								{(errorFetchingBalance as any)?.message ??
									"Failed to fetch available balance"}
							</Ariakit.Tooltip>
						</Ariakit.TooltipProvider>
					) : null}
				</span>
			</td>
			<td className="px-3 py-1">
				{data.type === "old" ? (
					<Link
						to={`/subscribe?to=${data.receiver}&amount=${formatUnits(
							BigInt(data.amountPerCycle),
							DAI_OPTIMISM.decimals,
						)}`}
						className="whitespace-nowrap rounded-lg bg-[#13785a] p-2 text-xs text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
					>
						Top up
					</Link>
				) : null}
			</td>
			<td className="px-3 py-1">
				<div>
					<button
						className="rounded-lg bg-[#13785a] p-2 text-xs text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
						disabled={!chain || chain.unsupported}
						onClick={withdrawDialog.toggle}
					>
						Withdraw
					</button>
					<Ariakit.Dialog
						store={withdrawDialog}
						backdrop={<div className="dialog-backdrop" />}
						className="dialog flex flex-col gap-8"
					>
						<button
							className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-black/20"
							onClick={withdrawDialog.toggle}
						>
							<Icon className="h-4 w-4 flex-shrink-0" name="x-icon" />

							<span className="sr-only">Close Dialog</span>
						</button>
						<form
							className="mx-auto flex w-full max-w-[450px] flex-col gap-4"
							onSubmit={handleWithdrawal}
						>
							<label className="flex flex-col gap-1">
								<span>Amount</span>

								<span className="relative isolate rounded-lg border border-black/[0.15] bg-[#ffffff] p-3 pb-[26px] dark:border-white/5 dark:bg-[#141414]">
									<input
										name="amountToWithdraw"
										className="elative z-10 w-full border-none bg-transparent pr-16 text-4xl !outline-none"
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
										value={amountToWithdraw}
										onChange={(e) => {
											if (!Number.isNaN(Number(e.target.value))) {
												setAmountToWithdraw(e.target.value.trim());
											}
										}}
										disabled={
											confirmingWithdrawal || confirmingWithdrawalTxOnChain
										}
									/>
									<span className="absolute bottom-0 right-4 top-3 my-auto flex flex-col gap-2">
										<p className="ml-auto flex items-center gap-1 text-xl">
											<img
												src={DAI_OPTIMISM.img}
												width={16}
												height={16}
												alt=""
											/>
											<span>DAI</span>
										</p>
										<p className="flex items-center gap-1 text-xs">
											<span>Claimable:</span>
											{fetchingBalance ? (
												<span className="inline-block h-4 w-8 animate-pulse rounded bg-gray-400" />
											) : errorFetchingBalance ? (
												<span>-</span>
											) : (
												<>
													<span>
														{typeof balance === "bigint"
															? formatNum(
																	formatUnits(balance, DAI_OPTIMISM.decimals),
																	2,
															  )
															: "-"}
													</span>
													<button
														type="button"
														className="text-[var(--page-text-color-2)] underline"
														onClick={() =>
															setAmountToWithdraw(
																balance
																	? formatUnits(balance, DAI_OPTIMISM.decimals)
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

							<div className="flex flex-nowrap gap-4">
								<div className="flex flex-col justify-between gap-1">
									<div
										className="h-8 w-8 rounded-full border-2 border-black bg-black first-of-type:mt-3 data-[disabled=true]:bg-[var(--page-bg-color-2)] data-[disabled=true]:opacity-40 dark:border-white dark:bg-white"
										data-disabled={
											!chain ||
											chain.id !== data.chainId ||
											confirmingWithdrawal ||
											confirmingWithdrawalTxOnChain ||
											disableWithdrawal ||
											confirmingTokenApproval ||
											waitingForApproveTxConfirmation ||
											isApproved ||
											amountToWithdraw.length === 0 ||
											amountToDeposit === 0n
										}
									/>
									<div className="mx-auto min-h-[4px] w-[2px] flex-1 bg-black opacity-40 dark:bg-white" />
									<div
										className="mb-3 h-8 w-8 rounded-full border-2 border-black bg-black data-[disabled=true]:bg-[var(--page-bg-color-2)] data-[disabled=true]:opacity-40 dark:border-white dark:bg-white"
										data-disabled={
											!chain ||
											chain.id !== data.chainId ||
											confirmingWithdrawal ||
											confirmingWithdrawalTxOnChain ||
											disableWithdrawal ||
											confirmingTokenApproval ||
											waitingForApproveTxConfirmation ||
											!isApproved ||
											amountToWithdraw.length === 0
										}
									/>
								</div>
								<div className="flex flex-1 flex-col gap-6">
									<button
										className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
										disabled={
											!chain ||
											chain.id !== data.chainId ||
											confirmingWithdrawal ||
											confirmingWithdrawalTxOnChain ||
											disableWithdrawal ||
											confirmingTokenApproval ||
											waitingForApproveTxConfirmation ||
											isApproved ||
											amountToWithdraw.length === 0 ||
											amountToDeposit === 0n
										}
										type="button"
										onClick={() => {
											approveToken?.({
												args: [
													data.subsContract as `0x${string}`,
													amountToDeposit,
												],
											});
										}}
									>
										{confirmingTokenApproval || waitingForApproveTxConfirmation
											? "Confirming..."
											: isApproved
											  ? "Approved"
											  : "Approve"}
									</button>

									<button
										className="rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
										disabled={
											!chain ||
											chain.id !== data.chainId ||
											confirmingWithdrawal ||
											confirmingWithdrawalTxOnChain ||
											disableWithdrawal ||
											confirmingTokenApproval ||
											waitingForApproveTxConfirmation ||
											!isApproved ||
											amountToWithdraw.length === 0
										}
									>
										{confirmingWithdrawal || confirmingWithdrawalTxOnChain
											? "Confirming..."
											: "Withdraw"}
									</button>
								</div>
							</div>

							{errorFetchingAllowance ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									{(errorFetchingAllowance as any)?.shortMessage ??
										errorFetchingAllowance.message}
								</p>
							) : null}
							{errorConfirmingTokenApproval ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									{(errorConfirmingTokenApproval as any)?.shortMessage ??
										errorConfirmingTokenApproval.message}
								</p>
							) : null}
							{errorConfirmingApproveTx ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									{(errorConfirmingApproveTx as any)?.shortMessage ??
										errorConfirmingApproveTx.message}
								</p>
							) : null}
							{errorConfirmingWithdrawTxDataOnChain ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									{(errorConfirmingWithdrawTxDataOnChain as any)
										?.shortMessage ??
										errorConfirmingWithdrawTxDataOnChain.message}
								</p>
							) : null}
							{errorConfirmingWithdrawal ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									{(errorConfirmingWithdrawal as any)?.shortMessage ??
										errorConfirmingWithdrawal.message}
								</p>
							) : null}
							{withdrawTxDataOnChain?.status === "reverted" ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									Transaction Reverted
								</p>
							) : null}
							{approveTxDataOnChain?.status === "reverted" ? (
								<p
									className="break-all text-center text-sm text-red-500"
									data-error-5
								>
									Transaction Reverted
								</p>
							) : null}
						</form>
					</Ariakit.Dialog>
				</div>
			</td>
			<td className="px-3 py-1">
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
					{confirmingUnsubscribeTx || waitingForUnsubscribeTxDataOnChain
						? "Confirming..."
						: "Unsubscribe"}
				</button>
			</td>
		</>
	);
};
