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

export const DAI_OPTIMISM = {
	address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
	name: "DAI",
	decimals: 18,
	img: `https://token-icons.llamao.fi/icons/tokens/10/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1?h=16&w=16`
};
