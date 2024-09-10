import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { erc20Abi } from "viem";
import { optimism } from "viem/chains";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { LLAMAPAY_CHAINS_LIB } from "~/lib/constants";
import { config } from "~/lib/wallet";
import type { IFormattedSub } from "~/types";

async function approveToken({
	address,
	chainId,
	subsContract,
	amountToDeposit,
}: {
	address: `0x${string}`;
	chainId: number;
	subsContract: `0x${string}`;
	amountToDeposit: bigint;
}) {
	try {
		const hash = await writeContract(config, {
			address,
			chainId: chainId as any,
			abi: erc20Abi,
			functionName: "approve",
			args: [subsContract, amountToDeposit],
		});

		const receipt = await waitForTransactionReceipt(config, { hash });

		if (receipt.status === "success") {
			toast.success("Transaction Success", {
				id: `tx-success${hash}`,
			});
		} else {
			toast.error("Transaction Failed", {
				id: `tx-failed${hash}`,
			});
		}

		return receipt;
	} catch (error) {
		throw new Error(
			`[TOKEN-APPROVAL]: ${error instanceof Error ? error.message : "Failed to approve token"}`,
		);
	}
}

export const useApproveToken = () => {
	return useMutation({ mutationFn: approveToken });
};

async function unsubscribe({
	address,
	data,
}: {
	address: `0x${string}`;
	data: IFormattedSub;
}) {
	try {
		const hash = await writeContract(config, {
			address,
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
			chainId: data.chainId as any,
		});

		const receipt = await waitForTransactionReceipt(config, { hash });

		if (receipt.status === "success") {
			toast.success("Transaction Success", {
				id: `tx-success${hash}`,
			});
		} else {
			toast.error("Transaction Failed", {
				id: `tx-failed${hash}`,
			});
		}

		return receipt;
	} catch (error) {
		const msg =
			error instanceof Error ? error.message : "Failed to unsubscribe";

		toast.error(msg.slice(0, 50), {
			id: `tx-failed${Date.now()}`,
		});

		throw new Error(`[UNSUBSCRIBE]: ${msg}}`);
	}
}

export const useUnsubscribe = () => {
	return useMutation({ mutationFn: unsubscribe });
};

async function withdraw({
	address,
	chainId,
	args,
}: {
	address: `0x${string}`;
	chainId: number;
	args: any;
}) {
	try {
		const hash = await writeContract(config, {
			address,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "batch",
			chainId: chainId as any,
			args,
		});

		const receipt = await waitForTransactionReceipt(config, { hash });

		if (receipt.status === "success") {
			toast.success("Transaction Success", {
				id: `tx-success${hash}`,
			});
		} else {
			toast.error("Transaction Failed", {
				id: `tx-failed${hash}`,
			});
		}

		return receipt;
	} catch (error) {
		throw new Error(
			`[WITHDRAW]: ${error instanceof Error ? error.message : "Failed to withdraw"}`,
		);
	}
}

export const useWithdraw = () => {
	return useMutation({ mutationFn: withdraw });
};

async function claimV1({
	args,
}: {
	args: any;
}) {
	try {
		const hash = await writeContract(config, {
			address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions_v1,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "claim",
			chainId: optimism.id,
			args,
		});

		const receipt = await waitForTransactionReceipt(config, { hash });

		if (receipt.status === "success") {
			toast.success("Transaction Success", {
				id: `tx-success${hash}`,
			});
		} else {
			toast.error("Transaction Failed", {
				id: `tx-failed${hash}`,
			});
		}

		return receipt;
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Failed to claim v1";
		toast.error(msg.slice(0, 50), {
			id: `tx-failed${Date.now()}`,
		});
		throw new Error(`[CLAIM-V1]: ${msg}`);
	}
}

export const useClaimV1 = () => {
	return useMutation({ mutationFn: claimV1 });
};

async function claimV2({
	args,
}: {
	args: any;
}) {
	try {
		const hash = await writeContract(config, {
			address: LLAMAPAY_CHAINS_LIB[optimism.id].contracts.subscriptions,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "claim",
			chainId: optimism.id,
			args,
		});

		const receipt = await waitForTransactionReceipt(config, { hash });

		if (receipt.status === "success") {
			toast.success("Transaction Success", {
				id: `tx-success${hash}`,
			});
		} else {
			toast.error("Transaction Failed", {
				id: `tx-failed${hash}`,
			});
		}

		return receipt;
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Failed to claim v2";
		toast.error(msg.slice(0, 50), {
			id: `tx-failed${Date.now()}`,
		});
		throw new Error(`[CLAIM-V2]: ${msg}`);
	}
}

export const useClaimV2 = () => {
	return useMutation({ mutationFn: claimV2 });
};
