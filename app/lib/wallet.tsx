import type { ReactNode } from "react";
import {
	type Chain,
	arbitrum,
	avalanche,
	base,
	bsc,
	mainnet,
	optimism,
	polygon,
} from "viem/chains";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { SafeConnector } from "wagmi/connectors/safe";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

import { LLAMAPAY_CHAINS_LIB } from "./constants";

const projectId = "2b0fa925a6e30cf250c05823fa9ef890";

const blast = {
	id: 81457,
	name: "Blast",
	nativeCurrency: {
		decimals: 18,
		name: "Ether",
		symbol: "ETH",
	},
	rpcUrls: {
		public: { http: ["https://rpc.blast.io"] },
		default: { http: ["https://rpc.blast.io"] },
	},
	blockExplorers: {
		default: {
			name: "Blastscan",
			url: "https://blastscan.io",
		},
	},
	contracts: {
		multicall3: {
			address: "0xcA11bde05977b3631167028862bE2a173976CA11",
			blockCreated: 212929,
		},
	},
	network: "blast",
} as const satisfies Chain;

export const supportedChains = [
	mainnet,
	optimism,
	polygon,
	arbitrum,
	base,
	bsc,
	avalanche,
	blast,
];

const { chains, publicClient, webSocketPublicClient } = configureChains(
	supportedChains,
	[
		jsonRpcProvider({
			rpc: (chain) => ({
				http: (LLAMAPAY_CHAINS_LIB as any)[chain.id].rpc,
			}),
		}),
	],
);

const config = createConfig({
	autoConnect: true,
	publicClient,
	webSocketPublicClient,
	connectors: [
		new InjectedConnector({ chains, options: { shimDisconnect: true } }),
		new WalletConnectConnector({
			chains,
			options: {
				projectId,
				metadata: {
					name: "LlamaPay",
					description: "Automate transactions and stream them by the second.",
					url: "https://llamapay.io",
					icons: ["https://llamapay.io/icon.svg"],
				},
			},
		}),
		new SafeConnector({
			chains,
			options: {
				allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
				debug: false,
			},
		}),
	],
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
	return <WagmiConfig config={config}>{children}</WagmiConfig>;
};

export const chainIdToNames: Record<
	number,
	{
		name: string;
		llamapayServerName: string;
		iconServerName: string;
		coinsServerName: string;
		blockExplorerUrl: string;
	}
> = {
	[mainnet.id]: {
		name: "Ethereum",
		llamapayServerName: "ethereum",
		iconServerName: "ethereum",
		coinsServerName: "ethereum",
		blockExplorerUrl: mainnet.blockExplorers.default.url,
	},
	[polygon.id]: {
		name: "Polygon",
		llamapayServerName: "polygon",
		iconServerName: "polygon",
		coinsServerName: "polygon",
		blockExplorerUrl: polygon.blockExplorers.default.url,
	},
	[optimism.id]: {
		name: "Optimism",
		llamapayServerName: "optimism",
		iconServerName: "optimism",
		coinsServerName: "optimism",
		blockExplorerUrl: optimism.blockExplorers.default.url,
	},
	[arbitrum.id]: {
		name: "Arbitrum",
		llamapayServerName: "arbitrum",
		iconServerName: "arbitrum",
		coinsServerName: "arbitrum",
		blockExplorerUrl: arbitrum.blockExplorers.default.url,
	},
	[base.id]: {
		name: "Base",
		llamapayServerName: "base",
		iconServerName: "base",
		coinsServerName: "base",
		blockExplorerUrl: base.blockExplorers.default.url,
	},
	[bsc.id]: {
		name: "BSC",
		llamapayServerName: "bsc",
		iconServerName: "binance",
		coinsServerName: "bsc",
		blockExplorerUrl: bsc.blockExplorers.default.url,
	},
	[avalanche.id]: {
		name: "Avalanche",
		llamapayServerName: "avalanche",
		iconServerName: "avalanche",
		coinsServerName: "avax",
		blockExplorerUrl: avalanche.blockExplorers.default.url,
	},
	[blast.id]: {
		name: "Blast",
		llamapayServerName: "blast",
		iconServerName: "blast",
		coinsServerName: "blast",
		blockExplorerUrl: blast.blockExplorers.default.url,
	},
};

export const llamapayChainNamesToIds: Record<string, number> =
	Object.fromEntries(
		Object.keys(chainIdToNames).map((id) => [
			chainIdToNames[+id as number].llamapayServerName,
			+id as number,
		]),
	);
