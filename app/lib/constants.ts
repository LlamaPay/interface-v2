import { mainnet, optimism } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

export const createJsonRpcProvider = (api: string) =>
	jsonRpcProvider({
		rpc: () => ({
			http: api
		})
	});

export const LLAMAPAY_CHAINS = [mainnet];

type ChainsLib = Record<
	number,
	{ rpc: string; contracts: { subscriptions?: string }; subgraphs: { subscriptions?: string } }
>;

export const LLAMAPAY_CHAINS_LIB: ChainsLib = {
	[mainnet.id]: {
		rpc: "https://eth.llamarpc.com",
		contracts: {},
		subgraphs: {}
	},
	[optimism.id]: {
		rpc: "https://rpc.ankr.com/optimism",
		contracts: {},
		subgraphs: {}
	}
};
