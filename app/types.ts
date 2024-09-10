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
	creationTx: string;
	subsContract: string;
}

export interface IFormattedSub extends ISub {
	periodDuration: number;
	fullPeriodStartingTime: number;
	totalAmountPaid: string;
	subDuration: number;
	chainId: number;
	type: "new" | "old";
	tokenAddress: string | null;
	tokenDecimal: number | null;
	tokenDivisor: bigint | null;
}

export interface INewSub {
	accumulator: string;
	amount_per_cycle: string;
	chain: string;
	creation_tx_hash: string;
	expiration_date: string;
	expires_at: string;
	from_address: string;
	initial_period: string;
	initial_shares: string;
	started_at: string;
	sub_id: string;
	subs_contract: string;
	to_address: string;
	unsubscribed: boolean;
}
