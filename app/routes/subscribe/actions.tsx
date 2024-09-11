import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { optimism } from "viem/chains";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { config } from "~/lib/wallet";

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
			abi: [
				{
					constant: false,
					inputs: [
						{ name: "_spender", type: "address" },
						{ name: "_value", type: "uint256" },
					],
					name: "approve",
					outputs: [],
					payable: false,
					stateMutability: "nonpayable",
					type: "function",
				},
			],
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
			`[TOKEN-APPROVAL]: ${
				error instanceof Error ? error.message : "Failed to approve token"
			}`,
		);
	}
}

export const useApproveToken = () => {
	return useMutation({ mutationFn: approveToken });
};

async function subscribe({
	address,
	args,
}: {
	address: `0x${string}`;
	args: any;
}) {
	try {
		const hash = await writeContract(config, {
			address,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "subscribe",
			chainId: optimism.id,
			dataSuffix:
				"0x0000000000000000000000000000000000000000000000000000000177bf6800",
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
			`[SUBSCRIBE]: ${
				error instanceof Error ? error.message : "Failed to subscribe"
			}`,
		);
	}
}

export const useSubscribe = () => {
	return useMutation({ mutationFn: subscribe });
};

async function extendSubscription({
	address,
	args,
}: {
	address: `0x${string}`;
	args: any;
}) {
	try {
		const hash = await writeContract(config, {
			address,
			abi: SUBSCRIPTIONS_ABI,
			functionName: "batch",
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
		throw new Error(
			`[EXTEND-SUB]: ${
				error instanceof Error ? error.message : "Failed to extend subscription"
			}`,
		);
	}
}

export const useExtendSubscription = () => {
	return useMutation({ mutationFn: extendSubscription });
};
