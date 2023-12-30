import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";

import { SUBSCRIPTIONS_ABI } from "~/lib/abi.subscriptions";
import { DAI_OPTIMISM, LLAMAPAY_CHAINS_LIB, SUBSCRIPTION_DURATION, SUBSCRIPTION_PERIOD } from "~/lib/constants";
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

const daysInMonth = 30;
const hoursInDay = 24;
const minutesInHour = 60;
// const secondsInMinute = 60;

export const formatSubs = (data: Array<ISub>) => {
	return data.map((sub) => {
		const startTimestamp = +sub.startTimestamp;
		const initialPeriod = +sub.initialPeriod;
		const expirationDate = +sub.expirationDate;
		const amountPerCycle = +sub.amountPerCycle;
		const realExpiration = +sub.realExpiration;
		const fullPeriodStartingTime = initialPeriod + SUBSCRIPTION_DURATION;
		const partialPeriodTime = fullPeriodStartingTime - startTimestamp;
		const fullCycles = (realExpiration - initialPeriod) / SUBSCRIPTION_DURATION;
		const amountPaidFully = fullCycles * amountPerCycle;
		const partialCycles = partialPeriodTime / SUBSCRIPTION_DURATION;
		const amountPaidPartially = partialCycles * amountPerCycle;

		const totalCycles = fullCycles + partialCycles;

		const totalDays = totalCycles * SUBSCRIPTION_PERIOD;

		let days = Math.floor(totalDays);
		const remainingHours = (totalDays - days) * hoursInDay;
		const hours = Math.floor(remainingHours);
		const remainingMinutes = (remainingHours - hours) * minutesInHour;
		const minutes = Math.floor(remainingMinutes);
		// const remainingSeconds = (remainingMinutes - minutes) * secondsInMinute
		// const seconds = Math.floor(remainingSeconds)

		const subDurationFormatted: Array<string> = [];

		if (startTimestamp === expirationDate) {
			subDurationFormatted.push("-");
		} else {
			if (days >= 30) {
				const months = days % daysInMonth;
				if (months > 0) {
					subDurationFormatted.push(`${months} ${months > 1 ? "months" : "month"}`);
					days -= months * daysInMonth;
				}
			}

			if (days > 0) {
				subDurationFormatted.push(`${days} ${days > 1 ? "days" : "day"}`);
			}
			if (hours > 0) {
				subDurationFormatted.push(`${hours} ${hours > 1 ? "hours" : "hour"}`);
			}
			if (minutes > 0) {
				subDurationFormatted.push(`${minutes} ${minutes > 1 ? "minutes" : "minute"}`);
			}
		}

		return {
			...sub,
			periodDuration: SUBSCRIPTION_DURATION,
			fullPeriodStartingTime,
			totalAmountPaid: +((amountPaidPartially + amountPaidFully) / 10 ** DAI_OPTIMISM.decimals).toFixed(2),
			subDuration: totalDays * 24 * 60 * 60,
			subDurationFormatted: subDurationFormatted.join(", ")
		} as IFormattedSub;
	});
};
