export interface ISub {
	expirationDate: string;
	id: string;
	initialPeriod: string;
	initialShares: string;
	owner: string;
	receiver: string;
	startTimestamp: string;
	unsubscribed: boolean;
	amountPerCycle: string;
	realExpiration: string;
	accumulator: string;
}

export interface IFormattedSub extends ISub {
	periodDuration: number;
	fullPeriodStartingTime: number;
	totalAmountPaid: number;
	subDuration: number;
	subDurationFormatted: string;
}
