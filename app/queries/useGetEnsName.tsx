import { http, createPublicClient } from "viem";
import { mainnet } from "viem/chains";
import { useEnsName } from "wagmi";

import { ENS_RESOLVER_ABI } from "~/lib/abi.ens-resolver";
import { LLAMAPAY_CHAINS_LIB, MAINNET_ENS_RESOLVER } from "~/lib/constants";

const getEnsName = async ({ address }: { address?: string }) => {
	try {
		if (!address) return null;
		const client = createPublicClient({
			chain: mainnet,
			transport: http(LLAMAPAY_CHAINS_LIB[mainnet.id].rpc),
		});

		const name = await client.readContract({
			address: MAINNET_ENS_RESOLVER,
			abi: ENS_RESOLVER_ABI,
			functionName: "getNames",
			args: [[address.toLowerCase()]],
		});
		const username = (name as Array<string>)?.[0];
		return username && username.length > 0 ? username : null;
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Failed to fetch ens name",
		);
	}
};

export const useGetEnsName = ({ address }: { address?: string }) => {
	return useEnsName({ address: address as `0x${string}`, chainId: 1 });
	// return useQuery(["ens-name", address], () => getEnsName({ address }));
};
