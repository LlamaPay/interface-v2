import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";

import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { LLAMAPAY_CHAINS_LIB } from "~/lib/constants";

export const SUB_CHAIN_LIB = LLAMAPAY_CHAINS_LIB[optimism.id];

export const client = createPublicClient({
	chain: optimism,
	transport: http(SUB_CHAIN_LIB.rpc)
});

export const subsContract = {
	address: SUB_CHAIN_LIB.contracts.subscriptions,
	abi: SUBSCRIPTIONS_ABI
} as const;

export const contract: any = getContract({
	...subsContract,
	publicClient: client as any
});
