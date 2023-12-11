import * as Ariakit from "@ariakit/react";
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

export const ConnectWallet = ({ className }: { className: string }) => {
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
					className="absolute right-6 top-[26px] flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-black/20"
					onClick={dialog.toggle}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
						<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
					</svg>

					<span className="sr-only">Close Dialog</span>
				</button>

				<ul className="flex flex-col gap-4">
					{connectors.map((connector) => (
						<li key={connector.id} className="flex items-center">
							<button
								disabled={!connector.ready}
								onClick={() => connect({ connector })}
								className="relative m-auto flex flex-1 items-center gap-1 rounded-lg bg-gray-100 p-4 dark:bg-black/20"
							>
								{isLoading && pendingConnector?.id === connector.id ? (
									<span className="absolute left-[6px] h-1 w-1 animate-ping rounded-full bg-blue-500"></span>
								) : null}

								<span className="mr-auto">{connector.name}</span>

								<span className="rounded-lg border border-white/10">
									<Icon name={connector.name} />
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

const Icon = ({ name }: { name: string }) => {
	const src = walletIcons.find(([wname]) => name.toLowerCase().includes(wname))?.[1] ?? null;

	if (!src) return null;

	return <img src={src} alt="" className="h-6 w-6 flex-shrink-0 rounded-lg object-cover" />;
};
