import { parseUnits } from "viem";
import { mainnet, optimism } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

export const createJsonRpcProvider = (api: string) =>
	jsonRpcProvider({
		rpc: () => ({
			http: api,
		}),
	});

export const LLAMAPAY_CHAINS_LIB = {
	[mainnet.id]: {
		rpc: "https://rpc.ankr.com/eth",
		contracts: {},
		subgraphs: {},
	},
	[optimism.id]: {
		rpc: "https://optimism.publicnode.com",
		contracts: { subscriptions: "0x58B05eB0e58761E294297B334869F98983de0169" },
		subgraphs: {
			subscriptions:
				"https://api.thegraph.com/subgraphs/name/0xngmi/llamasubs-optimism",
		},
	},
} as const;

export const DAI_OPTIMISM = {
	address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as `0x${string}`,
	name: "DAI",
	decimals: 18,
	img: "https://token-icons.llamao.fi/icons/tokens/10/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
} as const;

export const SUBSCRIPTION_PERIOD = 30; // 1 DAY
export const SUBSCRIPTION_DURATION = SUBSCRIPTION_PERIOD * 24 * 60 * 60; // in seconds

export const SUBSCRIPTION_AMOUNT_DIVISOR = parseUnits(
	"1",
	DAI_OPTIMISM.decimals,
);

export const MAINNET_ENS_RESOLVER =
	"0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";
