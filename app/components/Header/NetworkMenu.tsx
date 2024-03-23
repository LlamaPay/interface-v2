import * as Ariakit from "@ariakit/react";
import { mainnet, optimism } from "viem/chains";
import { useNetwork, useSwitchNetwork } from "wagmi";

import ethereumLogo from "~/assets/chains/ethereum.png";
import optimismLogo from "~/assets/chains/optimism.svg";
import { Icon } from "~/components/Icon";
import { formatChainName } from "~/utils/formatChainName";

const logos: Record<number, string> = {
	[mainnet.id]: ethereumLogo,
	[optimism.id]: optimismLogo,
};

export const NetworkMenu = () => {
	const { chain, chains } = useNetwork();
	const { switchNetwork } = useSwitchNetwork();

	return (
		<Ariakit.MenuProvider>
			<Ariakit.MenuButton className="hidden h-10 items-center gap-2 rounded-lg border border-[#E4EDEB] bg-[#f7fcfc] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white md:flex">
				<>
					<span className="sr-only">Switch network from </span>
					<span className="h-4 w-4 rounded-full">
						{chain && logos[chain.id] ? (
							<img
								src={logos[chain.id]}
								alt=""
								className="h-4 w-4 rounded-full"
							/>
						) : null}
					</span>
					<span>{chain ? formatChainName(chain.name) : ""}</span>
					<Icon
						className="h-4 w-4 flex-shrink-0 text-[#3D3D3D] dark:text-white/60"
						name="arrow-select"
					/>
				</>
			</Ariakit.MenuButton>
			<Ariakit.Menu
				gutter={4}
				className="hidden z-10 flex-col items-center gap-1 rounded-lg border border-[#E4EDEB] bg-[#f7fcfc] p-1 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white md:flex"
			>
				{chains.map((chain) => {
					return (
						<Ariakit.MenuItem
							className="mr-auto flex cursor-pointer items-center gap-2 rounded-lg p-2"
							key={chain.name}
							onClick={() => switchNetwork?.(chain.id)}
						>
							<span className="h-4 w-4 rounded-full">
								{chain && logos[chain.id] ? (
									<img
										src={logos[chain.id]}
										alt=""
										className="h-4 w-4 rounded-full"
									/>
								) : null}
							</span>
							<span>{chain ? formatChainName(chain.name) : ""}</span>
						</Ariakit.MenuItem>
					);
				})}
			</Ariakit.Menu>
		</Ariakit.MenuProvider>
	);
};
