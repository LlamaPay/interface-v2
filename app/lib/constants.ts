import { parseUnits } from "viem";
import {
	arbitrum,
	avalanche,
	base,
	bsc,
	mainnet,
	optimism,
	polygon,
} from "wagmi/chains";

function unscramble(str: string) {
	return str.split("").reduce((a, b) => {
		return a + String.fromCharCode(b.charCodeAt(0) + 8);
	}, "");
}
const apiKey = unscramble(".[^+0](,0[+1,*\\YZY\\[(*+Z,][/**,]");

export const LLAMAPAY_CHAINS_LIB = {
	[mainnet.id]: {
		rpc: "https://ethereum-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[optimism.id]: {
		rpc: "https://optimism-rpc.publicnode.com",
		contracts: {
			subscriptions: "0x58B05eB0e58761E294297B334869F98983de0169",
			subscriptions_v1: "0x8B6473801e466E543BAf0cB6c7Ea1C9321C3C816",
		},
		subgraphs: {
			subscriptions: `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/7SAiBm4sRAfPkHniw45Pw83GnyfE953p3LFr87N6XXwC`,
		},
	},
	[polygon.id]: {
		rpc: "https://polygon-bor-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[arbitrum.id]: {
		rpc: "https://arbitrum-one-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[base.id]: {
		rpc: "https://base-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[bsc.id]: {
		rpc: "https://bsc-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[avalanche.id]: {
		rpc: "https://avalanche-c-chain-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
	[81457]: {
		rpc: "https://blast-rpc.publicnode.com",
		contracts: {},
		subgraphs: {},
	},
} as const;

export const DAI_OPTIMISM = {
	address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as `0x${string}`,
	name: "DAI",
	decimals: 18,
	img: "https://token-icons.llamao.fi/icons/tokens/10/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
} as const;

export const SUBSCRIPTION_PERIOD = 30; // 30 DAYS
export const SUBSCRIPTION_DURATION = SUBSCRIPTION_PERIOD * 24 * 60 * 60; // in seconds

export const SUBSCRIPTION_AMOUNT_DIVISOR = parseUnits(
	"1",
	DAI_OPTIMISM.decimals,
);

export const MAINNET_ENS_RESOLVER =
	"0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";
