import { gql, request } from "graphql-request";

import { type INewSub, type ISub } from "~/types";

import { LLAMAPAY_CHAINS_LIB } from "~/lib/constants";
import { formatNewSubs, formatSubs } from "./utils";

export async function getSubscriptions(address?: string) {
	try {
		if (!address) return null;

		const subs = gql`
			{
				subs(
					where: {
						or: [
							{ owner: "${address.toLowerCase()}" },
							{ receiver: "${address.toLowerCase()}" }
						]
					}
					orderBy: realExpiration
					orderDirection: desc
				) {
					id
					owner
					receiver
					startTimestamp
					unsubscribed
					initialShares
					initialPeriod
					expirationDate
					amountPerCycle
					realExpiration
					accumulator
					creationTx
					subsContract
				}
			}
		`;
		const [data, newSubs]: [
			{ subs: Array<ISub> },
			{ subscriptions: Array<INewSub> },
		] = await Promise.all([
			request(
				LLAMAPAY_CHAINS_LIB[10].subgraphs.subscriptions,
				subs,
			) as Promise<{
				subs: Array<ISub>;
			}>,
			fetch(`https://api.llamapay.io/subscriptions/owned/${address}`).then(
				(res) => res.json(),
			),
		]);

		return [
			...formatNewSubs(newSubs.subscriptions),
			...formatSubs(data?.subs ?? []),
		];
	} catch (error: any) {
		throw new Error(error.message ?? "Failed to fetch subscriptions");
	}
}
