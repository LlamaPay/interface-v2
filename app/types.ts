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

export interface IFormattedSub {
	id: string;
	owner: string;
	receiver: string;
	startTimestamp: number;
	unsubscribed: boolean;
	initialShares: number;
	initialPeriod: number;
	expirationDate: number;
	periodDuration: number;
	fullPeriodStartingTime: number;
	totalAmountPaid: number;
	amountPerCycle: number;
	realExpiration: number;
	subDuration: number;
	subDurationFormatted: string;
	accumulator: number;
}
