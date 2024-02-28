import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";

import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { LLAMAPAY_CHAINS_LIB, SUBSCRIPTION_DURATION, SUBSCRIPTION_PERIOD } from "~/lib/constants";
import { type IFormattedSub, type ISub } from "~/types";

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

export const formatSubs = (data: Array<ISub>) => {
	return data.map((sub) => {
		const startTimestamp = +sub.startTimestamp;
		const initialPeriod = +sub.initialPeriod;

		const realExpiration = +sub.realExpiration;
		const fullPeriodStartingTime = initialPeriod + SUBSCRIPTION_DURATION;
		const partialPeriodTime = fullPeriodStartingTime - startTimestamp;
		const fullCycles = (realExpiration - fullPeriodStartingTime) / SUBSCRIPTION_DURATION;

		const partialCycles = partialPeriodTime / SUBSCRIPTION_DURATION;
		const totalCycles = fullCycles + partialCycles;

		const totalDays = totalCycles * SUBSCRIPTION_PERIOD;
		// const remainingSeconds = (remainingMinutes - minutes) * secondsInMinute
		// const seconds = Math.floor(remainingSeconds)

		return {
			...sub,
			periodDuration: SUBSCRIPTION_DURATION,
			fullPeriodStartingTime,
			subDuration: totalDays * 24 * 60 * 60
		} as IFormattedSub;
	});
};
