import * as Ariakit from "@ariakit/react";
import { useAccount, useBalance, useDisconnect, useEnsName } from "wagmi";

import { Icon } from "~/components/Icon";
import { formatAddress } from "~/utils/formatAddress";

export const AccountMenu = ({ className }: { className: string }) => {
	const dialog = Ariakit.useDialogStore({ animated: true });

	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { data } = useBalance();

	const { data: ensName } = useEnsName({
		address,
		chainId: 1
	});

	return (
		<>
			<Ariakit.Button onClick={dialog.show} className={className}>
				{address ? ensName ?? formatAddress(address) : null}
			</Ariakit.Button>
			<Ariakit.Dialog store={dialog} backdrop={<div className="dialog-backdrop" />} className="dialog">
				<button
					className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-black/20"
					onClick={dialog.toggle}
				>
					<Icon className="h-4 w-4 flex-shrink-0" name="x-icon" />

					<span className="sr-only">Close Dialog</span>
				</button>

				<Ariakit.DialogHeading className="mt-4 text-center text-xl font-semibold">
					{ensName ?? formatAddress(address)}
				</Ariakit.DialogHeading>

				<p className="mt-1 text-center text-sm text-black text-opacity-60 dark:text-white">{`${data?.formatted ?? 0} ${
					data?.symbol ?? "ETH"
				}`}</p>

				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					<button
						className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-gray-100 p-2 text-sm dark:bg-black/20"
						onClick={() => {
							navigator.clipboard.writeText(address ?? "");
						}}
					>
						<Icon name="copy" className="h-4 w-4" />
						<span>Copy Address</span>
					</button>
					<button
						className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-gray-100 p-2 text-sm dark:bg-black/20"
						onClick={() => disconnect?.()}
					>
						<Icon name="arrow-left-on-rectangle" className="h-4 w-4" style={{ transform: "scale(-1)" }} />

						<span>Disconnect</span>
					</button>
				</div>
			</Ariakit.Dialog>
		</>
	);
};
