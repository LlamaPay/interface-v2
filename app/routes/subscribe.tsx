import * as Ariakit from "@ariakit/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useRef, useState } from "react";
import { getAddress, parseUnits } from "viem";
import { optimism } from "viem/chains";
import {
	erc20ABI,
	useAccount,
	useBalance,
	useContractRead,
	useContractWrite,
	useNetwork,
	useSwitchNetwork,
	useWaitForTransaction
} from "wagmi";

import { ConnectWallet } from "~/components/ConnectWallet";
import { Icon } from "~/components/Icon";
import { useHydrated } from "~/hooks/useHydrated";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, LLAMAPAY_CHAINS_LIB, SUBSCRIPTION_DURATION } from "~/lib/constants";
import { formatNum } from "~/utils/formatNum";

export const meta: MetaFunction = () => {
	return [
		{ title: "Subscriptions - LlamaPay" },
		{
			name: "description",
			content:
				"Recurring subscriptions while having subscribers also earn yield on their deposits through ERC4626-compatible vaults."
		}
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const searchParams = new URL(request.url).searchParams;
	const to = searchParams.get("to");
	const amount = searchParams.get("amount");

	if (typeof to !== "string" || typeof amount !== "string" || amount.length === 0 || Number.isNaN(Number(amount))) {
		throw new Response("Not Found", { status: 404 });
	}

	return { to: getAddress(to), amount };
}

export default function Index() {
	const loaderData: any = useLoaderData();

	const { address, isConnected } = useAccount();
	const { chain } = useNetwork();
	const { switchNetwork } = useSwitchNetwork();
	const hydrated = useHydrated();
	const navigate = useNavigate();

	const {
		data: balance,
		isLoading: fetchingBalance,
		error: errorFetchingBalance,
		refetch: refetchBalance
	} = useBalance({
		address,
		token: DAI_OPTIMISM.address as `0x${string}`,
		chainId: optimism.id,
		cacheTime: 20_000
	});

	const formRef = useRef<HTMLFormElement>(null);

	const [amountToDeposit, setAmountToDeposit] = useState("");

	const {
		data: allowance,
		error: errorFetchingAllowance,
		refetch: refetchAllowance
	} = useContractRead({
		address: DAI_OPTIMISM.address as `0x${string}`,
		abi: erc20ABI,
		functionName: "allowance",
		args: address &&
			LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions && [
				address,
				LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions as `0x${string}`
			],
		enabled: address && LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions ? true : false,
		cacheTime: 20_000
	});

	const {
		data: currentPeriod,
		isLoading: fetchingCurrentPeriod,
		error: errorFetchingCurrentPeriod,
		refetch: refetchCurrentPeriod
	} = useContractRead({
		address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "currentPeriod",
		cacheTime: 20_000
	});

	const isApproved =
		allowance && amountToDeposit.length > 0 ? allowance >= parseUnits(amountToDeposit, DAI_OPTIMISM.decimals) : false;

	const {
		data: approveTxData,
		write: approveToken,
		isLoading: confirmingTokenApproval,
		error: errorConfirmingTokenApproval
	} = useContractWrite({
		address: DAI_OPTIMISM.address as `0x${string}`,
		abi: erc20ABI,
		functionName: "approve"
	});

	const { isLoading: waitingForApproveTxConfirmation, error: errorConfirmingApproveTx } = useWaitForTransaction({
		hash: approveTxData?.hash,
		enabled: approveTxData ? true : false,
		onSuccess(data) {
			if (data.status === "success") {
				refetchAllowance();
				refetchCurrentPeriod();
			}
		}
	});

	const realCost = amountToDeposit.length > 0 ? loaderData.amount - (0.05 * +amountToDeposit) / 12 : null;
	const expectedMonths = realCost ? Math.floor(+amountToDeposit / realCost) : null;

	const {
		data: subscribeTxData,
		write: subscribe,
		isLoading: confirmingSubscription,
		error: errorConfirmingSubscription
	} = useContractWrite({
		address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
		abi: SUBSCRIPTIONS_ABI,
		functionName: "subscribe"
	});
	const {
		data: subscribeTxDataOnChain,
		isLoading: waitingForSubscriptionTxDataOnChain,
		error: errorWaitingForSubscriptionTxDataOnChain
	} = useWaitForTransaction({
		hash: subscribeTxData?.hash,
		enabled: subscribeTxData ? true : false,
		onSuccess(data) {
			if (data.status === "success") {
				window.parent.postMessage(
					{
						subscribed: true,
						totalDeposited: amountToDeposit,
						expectedMonthsLength: expectedMonths
					},
					"*"
				);
				navigate("/");

				formRef.current?.reset();

				refetchBalance();
				refetchAllowance();
				refetchCurrentPeriod();
			}
		}
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const amountPerCycle = loaderData.amount;
		const decimalsAmountPerCycle = parseUnits(amountPerCycle, DAI_OPTIMISM.decimals);
		const currentTime = BigInt(Math.floor(Date.now() / 1e3));
		let timeDiff = (currentPeriod as bigint) + BigInt(SUBSCRIPTION_DURATION) - currentTime;
		while (timeDiff < 0) {
			timeDiff += BigInt(SUBSCRIPTION_DURATION);
		}
		const claimableThisPeriod = (decimalsAmountPerCycle * timeDiff) / BigInt(SUBSCRIPTION_DURATION);
		subscribe?.({
			args: [
				loaderData.to,
				decimalsAmountPerCycle,
				parseUnits(amountToDeposit, DAI_OPTIMISM.decimals) - claimableThisPeriod
			]
		});
	};

	const disableAll = !hydrated || !address || !chain || chain.id !== optimism.id;
	const disableApprove =
		disableAll ||
		isApproved ||
		confirmingTokenApproval ||
		waitingForApproveTxConfirmation ||
		confirmingSubscription ||
		waitingForSubscriptionTxDataOnChain ||
		!LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions ||
		amountToDeposit.length === 0;
	const disableSubscribe =
		disableAll ||
		amountToDeposit.length === 0 ||
		+amountToDeposit < +loaderData.amount ||
		!isApproved ||
		!balance ||
		+balance.formatted < +amountToDeposit ||
		!currentPeriod ||
		fetchingCurrentPeriod ||
		confirmingTokenApproval ||
		waitingForApproveTxConfirmation ||
		confirmingSubscription ||
		waitingForSubscriptionTxDataOnChain;

	return (
		<main className="overflow-autopx-4 mx-auto flex w-full max-w-[450px] flex-col gap-5 py-9 md:-left-[102px]">
			<Link to="/" className="flex items-center gap-1 text-[#70757d] dark:text-[#9CA3AF]">
				<Icon name="arrow-left-sm" className="h-4 w-4 flex-shrink-0" />
				<span>Dashboard</span>
			</Link>
			<h1 className="mb-4 text-center text-xl font-medium">Subscribe</h1>
			<table className="my-4 border-collapse">
				<tbody>
					<tr>
						<th className=" border border-black/[0.15] p-2 text-center text-base font-normal dark:border-white/[0.15]">
							To
						</th>
						<td className=" border border-black/[0.15] p-2 text-center text-base dark:border-white/[0.15]">
							<a
								target="_blank"
								rel="noreferrer noopener"
								href={`https://optimistic.etherscan.io/address/${loaderData.to}`}
								className="underline"
							>
								{loaderData.to.slice(0, 6) + "..." + loaderData.to.slice(-6)}
							</a>
						</td>
					</tr>
					<tr>
						<th className=" border border-black/[0.15] p-2 text-center text-base font-normal dark:border-white/[0.15]">
							Amount per month
						</th>
						<td className=" border border-black/[0.15] p-2 text-center text-base dark:border-white/[0.15]">
							<span className="flex items-center justify-center gap-1">
								<img src={DAI_OPTIMISM.img} width={14} height={14} alt="" />
								<span>{loaderData.amount + " DAI"}</span>
							</span>
						</td>
					</tr>
				</tbody>
			</table>

			<div className="w-full">
				<form className="flex flex-col gap-4" onSubmit={handleSubmit} ref={formRef}>
					<label className="flex flex-col gap-1">
						<span>Amount to deposit</span>
						<input
							name="amountToDeposit"
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
							value={amountToDeposit}
							onChange={(e) => {
								if (!Number.isNaN(Number(e.target.value))) {
									setAmountToDeposit(e.target.value.trim());
								}
							}}
							disabled={confirmingSubscription || waitingForSubscriptionTxDataOnChain}
						/>

						<p className="flex items-center gap-1 rounded-lg border border-black/[0.05] p-3 text-sm dark:border-white/5">
							<span>Balance:</span>
							{!hydrated || fetchingBalance ? (
								<span className="inline-block h-4 w-[10ch] animate-pulse rounded bg-gray-400"></span>
							) : !isConnected || errorFetchingBalance ? null : (
								<>
									<img src={DAI_OPTIMISM.img} width={14} height={14} alt="" />
									<span>{(formatNum(balance ? +balance.formatted : null, 2) ?? "0") + " DAI"}</span>
								</>
							)}
						</p>

						<span className="mt-1 hidden text-xs text-red-500 peer-[&:not(:placeholder-shown):not(:focus):invalid]:block">
							Enter numbers only
						</span>
					</label>

					<p className="-mt-3 flex items-center gap-1 rounded-lg border border-black/[0.05] p-3 text-sm dark:border-white/5">
						<span>Real Cost:</span>
						{realCost && realCost < 0 ? (
							<>
								<span>Free</span>
								<Ariakit.TooltipProvider showTimeout={0}>
									<Ariakit.TooltipAnchor
										render={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												className="h-5 w-5"
											>
												<path
													fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
													clipRule="evenodd"
												/>
											</svg>
										}
									/>
									<Ariakit.Tooltip className="max-w-xs cursor-default border border-solid border-black bg-white p-1 text-sm text-black">
										{`This assumes current yield doesn't go down`}
									</Ariakit.Tooltip>
								</Ariakit.TooltipProvider>
							</>
						) : (
							<>
								<img src={DAI_OPTIMISM.img} width={14} height={14} alt="" />
								<span>{`${formatNum(realCost, 2) ?? 0} DAI per month`}</span>
							</>
						)}
					</p>
					{expectedMonths && expectedMonths < 0 ? (
						<>
							<p className="-mt-3 flex items-center gap-1 rounded-lg border border-black/[0.05] p-3 text-sm dark:border-white/5">
								<span>{`Subscription Months: Infinite`}</span>
								<Ariakit.TooltipProvider showTimeout={0}>
									<Ariakit.TooltipAnchor
										render={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												className="h-5 w-5"
											>
												<path
													fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
													clipRule="evenodd"
												/>
											</svg>
										}
									/>
									<Ariakit.Tooltip className="max-w-xs cursor-default border border-solid border-black bg-white p-1 text-sm text-black">
										{`This assumes current yield doesn't go down`}
									</Ariakit.Tooltip>
								</Ariakit.TooltipProvider>
							</p>
						</>
					) : (
						<p className="-mt-3 flex items-center gap-1 rounded-lg border border-black/[0.05] p-3 text-sm dark:border-white/5">
							{`Subscription Months: ${expectedMonths ?? ""}`}
						</p>
					)}

					{!hydrated ? null : !isConnected || !chain ? (
						<ConnectWallet
							className="rounded-lg border border-[#13785a] bg-[rgba(245,250,249,0.50)] p-3 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#23BF91] dark:bg-[rgba(43,43,43,0.50)] dark:text-white"
							chainId={optimism.id}
						/>
					) : chain.id !== optimism.id ? (
						<button
							onClick={() => switchNetwork?.(chain.id)}
							className="rounded-lg border border-[#13785a] bg-[rgba(245,250,249,0.50)] p-3 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#23BF91] dark:bg-[rgba(43,43,43,0.50)] dark:text-white"
						>
							Switch Network
						</button>
					) : null}

					<div className="flex w-full flex-wrap items-center gap-2">
						<button
							className="flex-1 rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
							disabled={disableApprove}
							type="button"
							onClick={() => {
								approveToken?.({
									args: [
										LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions as `0x${string}`,
										parseUnits(amountToDeposit, DAI_OPTIMISM.decimals)
									]
								});
							}}
						>
							{!hydrated
								? "Approve"
								: confirmingTokenApproval || waitingForApproveTxConfirmation
									? "Confirming..."
									: isApproved
										? "Approved"
										: "Approve"}
						</button>

						<button
							className="flex-1 rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
							disabled={disableSubscribe}
						>
							{confirmingSubscription || waitingForSubscriptionTxDataOnChain ? "Confirming..." : "Subscribe"}
						</button>
					</div>

					{errorConfirmingTokenApproval ? (
						<p className="text-center text-sm text-red-500">
							{(errorConfirmingTokenApproval as any)?.shortMessage ?? errorConfirmingTokenApproval.message}
						</p>
					) : null}
					{errorConfirmingApproveTx ? (
						<p className="text-center text-sm text-red-500">
							{(errorConfirmingApproveTx as any)?.shortMessage ?? errorConfirmingApproveTx.message}
						</p>
					) : null}
					{errorConfirmingSubscription ? (
						<p className="text-center text-sm text-red-500">
							{(errorConfirmingSubscription as any)?.shortMessage ?? errorConfirmingSubscription.message}
						</p>
					) : null}
					{errorWaitingForSubscriptionTxDataOnChain ? (
						<p className="text-center text-sm text-red-500">
							{(errorWaitingForSubscriptionTxDataOnChain as any)?.shortMessage ??
								errorWaitingForSubscriptionTxDataOnChain.message}
						</p>
					) : null}

					{errorFetchingAllowance ? (
						<p className="text-center text-sm text-red-500">
							{(errorFetchingAllowance as any)?.shortMessage ?? errorFetchingAllowance.message}
						</p>
					) : null}

					{errorFetchingCurrentPeriod ? (
						<p className="text-center text-sm text-red-500">Failed to calculate total amount to be paid</p>
					) : null}

					{subscribeTxDataOnChain ? (
						subscribeTxDataOnChain.status === "success" ? (
							<p className="text-center text-sm text-green-500">Transaction Success</p>
						) : (
							<p className="text-center text-sm text-red-500">Transaction Failed</p>
						)
					) : null}
				</form>
			</div>
		</main>
	);
}
