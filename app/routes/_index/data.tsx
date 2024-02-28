import { request, gql } from "graphql-request";

import { type ISub } from "~/types";

import { SUB_CHAIN_LIB, formatSubs } from "./utils";

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
				}
			}
		`;
		const data: { subs: Array<ISub> } = await request(SUB_CHAIN_LIB.subgraphs.subscriptions, subs);

		return formatSubs(data?.subs ?? []);
	} catch (error: any) {
		throw new Error(error.message ?? "Failed to fetch subscriptions");
	}
}
