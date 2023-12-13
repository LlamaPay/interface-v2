import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";

import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, LLAMAPAY_CHAINS_LIB, SUBSCRIPTION_DURATION } from "~/lib/constants";
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
		const id = sub.id;
		const owner = sub.owner;
		const receiver = sub.receiver;
		const startTimestamp = +sub.startTimestamp;
		const unsubscribed = sub.unsubscribed;
		const initialShares = +sub.initialShares;
		const initialPeriod = +sub.initialPeriod;
		const expirationDate = +sub.expirationDate;
		const amountPerCycle = +sub.amountPerCycle;
		const realExpiration = +sub.realExpiration;
		const accumulator = +sub.accumulator;
		const fullPeriodStartingTime = initialPeriod + SUBSCRIPTION_DURATION;
		const partialPeriodTime = fullPeriodStartingTime - startTimestamp;
		const fullCycles = (expirationDate - initialPeriod) / SUBSCRIPTION_DURATION;
		const amountPaidFully = fullCycles * amountPerCycle;
		const partialCycles = partialPeriodTime / SUBSCRIPTION_DURATION;
		const amountPaidPartially = partialCycles * amountPerCycle;

		let subDuration = "";

		subDuration = `${fullCycles} ${SUBSCRIPTION_DURATION === 24 * 60 * 60 ? "days" : "month"}`;

		if (partialCycles) {
			subDuration += `,`;

			const [hours, minutes] = (partialCycles * 24).toString().split(".");

			if (hours) {
				subDuration += ` ${hours} hours`;
			}

			if (minutes) {
				subDuration += ` ${(+minutes * 60).toString().slice(0, 2)} minutes`;
			}
		}

		return {
			id,
			owner,
			receiver,
			startTimestamp,
			unsubscribed,
			initialShares,
			initialPeriod,
			expirationDate,
			periodDuration: SUBSCRIPTION_DURATION,
			fullPeriodStartingTime,
			totalAmountPaid: +((amountPaidPartially + amountPaidFully) / 10 ** DAI_OPTIMISM.decimals).toFixed(2),
			amountPerCycle,
			realExpiration,
			subDuration,
			accumulator
		} as IFormattedSub;
	});
};
