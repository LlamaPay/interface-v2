import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	arbitrum,
	avalanche,
	base,
	blast,
	bsc,
	mainnet,
	optimism,
	polygon,
} from "viem/chains";
import {
	http,
	type State,
	WagmiProvider,
	cookieStorage,
	createConfig,
	createStorage,
} from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { LLAMAPAY_CHAINS_LIB } from "./constants";

const queryClient = new QueryClient();
const projectId = "2b0fa925a6e30cf250c05823fa9ef890";

export const config = createConfig({
	chains: [mainnet, optimism, polygon, arbitrum, base, bsc, avalanche, blast],
	connectors: [injected(), walletConnect({ projectId }), coinbaseWallet()],
	ssr: true,
	storage: createStorage({
		storage: cookieStorage,
	}),
	transports: {
		[mainnet.id]: http(LLAMAPAY_CHAINS_LIB[mainnet.id].rpc),
		[optimism.id]: http(LLAMAPAY_CHAINS_LIB[optimism.id].rpc),
		[polygon.id]: http(LLAMAPAY_CHAINS_LIB[polygon.id].rpc),
		[arbitrum.id]: http(LLAMAPAY_CHAINS_LIB[arbitrum.id].rpc),
		[base.id]: http(LLAMAPAY_CHAINS_LIB[base.id].rpc),
		[bsc.id]: http(LLAMAPAY_CHAINS_LIB[bsc.id].rpc),
		[avalanche.id]: http(LLAMAPAY_CHAINS_LIB[avalanche.id].rpc),
		[blast.id]: http(LLAMAPAY_CHAINS_LIB[blast.id].rpc),
	},
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
