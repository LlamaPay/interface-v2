import { type ReactNode } from "react";
import { createConfig, configureChains, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { InjectedConnector } from "wagmi/connectors/injected";
import { SafeConnector } from "wagmi/connectors/safe";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

import { LLAMAPAY_CHAINS_LIB } from "./constants";

const projectId = "b3d4ba9fb97949ab12267b470a6f31d2";

const { chains, publicClient, webSocketPublicClient } = configureChains(
	[mainnet],
	[
		jsonRpcProvider({
			rpc: (chain) => ({
				http: LLAMAPAY_CHAINS_LIB[chain.id].rpc
			})
		})
	]
);

const config = createConfig({
	autoConnect: true,
	publicClient,
	webSocketPublicClient,
	connectors: [
		new InjectedConnector({ chains }),
		new WalletConnectConnector({
			chains,
			options: {
				projectId
			}
		}),
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