import * as Ariakit from "@ariakit/react";
import { optimism } from "viem/chains";
import { useConnect } from "wagmi";

import brave from "~/assets/wallets/brave.svg";
import coinbase from "~/assets/wallets/coinbase.svg";
import metamask from "~/assets/wallets/metamask.svg";
import phantom from "~/assets/wallets/phantom.svg";
import rabby from "~/assets/wallets/rabby.svg";
import rainbow from "~/assets/wallets/rainbow.svg";
import safe from "~/assets/wallets/safe.svg";
import uniswap from "~/assets/wallets/uniswap.svg";
import walletconnect from "~/assets/wallets/walletconnect.svg";
import { Icon } from "~/components/Icon";

const walletIcons = Object.entries({
	brave,
	coinbase,
	metamask,
	phantom,
	rabby,
	safe,
	uniswap,
	walletconnect,
	rainbow
});

export const ConnectWallet = ({ className, chainId = optimism.id }: { className: string; chainId?: number }) => {
	const dialog = Ariakit.useDialogStore({ animated: true });

	const { connect, connectors, error, isLoading, pendingConnector } = useConnect();

	return (
		<>
			<Ariakit.Button onClick={dialog.show} className={className}>
				Connect Wallet
			</Ariakit.Button>
			<Ariakit.Dialog
				store={dialog}
				backdrop={<div className="dialog-backdrop" />}
				className="dialog flex flex-col gap-8"
			>
				<Ariakit.DialogHeading className="text-center text-lg font-semibold">Connect Wallet</Ariakit.DialogHeading>

				<button
					className="absolute right-6 top-[26px] flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-black dark:bg-black/20 dark:text-white"
					onClick={dialog.toggle}
				>
					<Icon className="h-4 w-4 flex-shrink-0" name="x-icon" />
					<span className="sr-only">Close Dialog</span>
				</button>

				<ul className="flex flex-col gap-4">
					{connectors.map((connector) => (
						<li key={connector.id} className="flex items-center">
							<button
								disabled={!connector.ready}
								onClick={() => {
									connect({ connector, chainId });
									if (!error) {
										dialog.toggle();
									}
								}}
								className="relative m-auto flex flex-1 items-center gap-1 rounded-lg bg-gray-100 p-4 dark:bg-black/20"
							>
								{isLoading && pendingConnector?.id === connector.id ? (
									<span className="absolute left-[6px] h-1 w-1 animate-ping rounded-full bg-blue-500"></span>
								) : null}

								<span className="mr-auto">{connector.name}</span>

								<span className="rounded-lg border border-white/10">
									<ConnectorLogo name={connector.name} />
								</span>
							</button>
						</li>
					))}
				</ul>
				{error ? <p className="text-center text-sm text-red-500">{error.message}</p> : null}
			</Ariakit.Dialog>
		</>
	);
};

const ConnectorLogo = ({ name }: { name: string }) => {
	const src = walletIcons.find(([wname]) => name.toLowerCase().includes(wname))?.[1] ?? null;

	if (!src) return null;

	return <img src={src} alt="" className="h-6 w-6 flex-shrink-0 rounded-lg object-cover" />;
};
