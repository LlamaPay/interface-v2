import { type LoaderFunctionArgs } from "@remix-run/node";
import { gql, request as grequest } from "graphql-request";
import { optimism } from "viem/chains";

import { LLAMAPAY_CHAINS_LIB } from "~/lib/constants";
import { type ISub } from "~/types";

import { formatSubs } from "./_index/utils";

export async function loader({ request }: LoaderFunctionArgs) {
	const searchParams = new URL(request.url).searchParams;
	const owner = searchParams.get("owner");
	const receiver = searchParams.get("receiver");

	if (!owner || !receiver) return [];

	try {
		const subs = gql`
    {
        subs(
            where: {
                and: [
                    { owner: "${owner.toLowerCase()}" },
                    { receiver: "${receiver.toLowerCase()}" }
                ]
            }
            orderBy: expirationDate
            orderDirection: desc
        ) {
            id
            receiver
            startTimestamp
            unsubscribed
            initialShares
            initialPeriod
            expirationDate
            amountPerCycle
            realExpiration
            accumulator
        }
    }
`;
		const data: { subs: Array<ISub> } = await grequest(LLAMAPAY_CHAINS_LIB[optimism.id].subgraphs.subscriptions, subs);

		return formatSubs(data?.subs ?? []);
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : "Failed to fetch subscriptions");
	}
}
