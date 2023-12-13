import { parseUnits } from "viem";
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
	{ rpc: string; contracts: { subscriptions?: `0x${string}` }; subgraphs: { subscriptions?: string } }
>;

export const LLAMAPAY_CHAINS_LIB: ChainsLib = {
	[mainnet.id]: {
		rpc: "https://eth.llamarpc.com",
		contracts: {},
		subgraphs: {}
	},
	[optimism.id]: {
		rpc: "https://rpc.ankr.com/optimism",
		contracts: { subscriptions: "0x543e186ae5c7fea674c489f50215ee8036e87897" },
		subgraphs: { subscriptions: "https://api.thegraph.com/subgraphs/name/0xngmi/llamasubs-optimism" }
	}
};

export const DAI_OPTIMISM = {
	address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
	name: "DAI",
	decimals: 18,
	img: `https://token-icons.llamao.fi/icons/tokens/10/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1?h=16&w=16`
};

export const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60;

export const SUBSCRIPTION_AMOUNT_DIVISOR = parseUnits("1", DAI_OPTIMISM.decimals);
