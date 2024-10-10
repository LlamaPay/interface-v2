import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { erc20Abi } from "viem";
import {
	readContract,
	waitForTransactionReceipt,
	writeContract,
} from "wagmi/actions";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
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

const min = (a: bigint, b: bigint) => (a > b ? b : a);

async function claim({
	address,
	chainId,
	toClaim,
}: {
	address: `0x${string}`;
	chainId: number;
	toClaim: bigint;
}) {
	try {
		const shares = await readContract(config, {
			address,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "convertToShares",
			chainId: chainId as any,
			args: [toClaim],
		});

		const hash = await writeContract(config, {
			address,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "claim",
			chainId: chainId as any,
			args: [min(toClaim, shares)],
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
		throw new Error(`[CLAIM]: ${msg}`);
	}
}

export const useClaim = () => {
	return useMutation({ mutationFn: claim });
};
