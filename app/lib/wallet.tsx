import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	http,
	type State,
	WagmiProvider,
	cookieStorage,
	createConfig,
	createStorage,
} from "wagmi";
import {
	arbitrum,
	avalanche,
	base,
	blast,
	bsc,
	mainnet,
	optimism,
	polygon,
} from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const queryClient = new QueryClient();
const projectId = "2b0fa925a6e30cf250c05823fa9ef890";

const transports = {
	[mainnet.id]: http(),
	[optimism.id]: http(),
	[polygon.id]: http(),
	[arbitrum.id]: http(),
	[base.id]: http(),
	[bsc.id]: http(),
	[avalanche.id]: http(),
	[blast.id]: http(),
} as const;

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

export type TSupportedChains = keyof typeof transports;

export const config = createConfig({
	chains: [mainnet, polygon, optimism, arbitrum, base, blast, bsc, avalanche],
	connectors: [injected(), walletConnect({ projectId }), coinbaseWallet()],
	ssr: true,
	storage: createStorage({
		storage: cookieStorage,
	}),
	transports,
});

export const WalletProvider = ({
	children,
	initialState,
}: {
	children: ReactNode;
	initialState?: State;
}) => {
	return (
		<WagmiProvider config={config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
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
