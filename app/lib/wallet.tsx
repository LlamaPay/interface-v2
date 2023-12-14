import { type ReactNode } from "react";
import { optimism } from "viem/chains";
import { createConfig, configureChains, WagmiConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { SafeConnector } from "wagmi/connectors/safe";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

import { LLAMAPAY_CHAINS_LIB } from "./constants";

const projectId = "2b0fa925a6e30cf250c05823fa9ef890";

const { chains, publicClient, webSocketPublicClient } = configureChains(
	[optimism],
	[
		jsonRpcProvider({
			rpc: (chain) => ({
				http: (LLAMAPAY_CHAINS_LIB as any)[chain.id].rpc
			})
		})
	]
);

const config = createConfig({
	autoConnect: true,
	publicClient,
	webSocketPublicClient,
	connectors: [
		new InjectedConnector({ chains, options: { shimDisconnect: true } }),
		new SafeConnector({
			chains,
			options: {
				allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
				debug: false
			}
		})
	]
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
	return <WagmiConfig config={config}>{children}</WagmiConfig>;
};
