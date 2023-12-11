import * as Ariakit from "@ariakit/react";
import { mainnet, optimism } from "viem/chains";
import { useNetwork } from "wagmi";

import ethereumLogo from "~/assets/chains/ethereum.png";
import optimismLogo from "~/assets/chains/optimism.svg";
import { Icon } from "~/components/Icon";

const logos: Record<number, string> = { [mainnet.id]: ethereumLogo, [optimism.id]: optimismLogo };

export const NetworkMenu = () => {
	const { chain, chains } = useNetwork();

	return (
		<Ariakit.SelectProvider defaultValue="Apple">
			<Ariakit.SelectLabel className="sr-only">Switch Network</Ariakit.SelectLabel>
			<Ariakit.Select className="flex items-center gap-2 rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-2 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white">
				<>
					<span className="h-4 w-4 rounded-full">
						{chain && logos[chain.id] ? <img src={logos[chain.id]} alt="" className="h-4 w-4 rounded-full" /> : null}
					</span>
					<span>{chain ? formatName(chain.name) : ""}</span>
					<Icon className="h-4 w-4 flex-shrink-0 text-[#3D3D3D] dark:text-white/60" name="arrow-select" />
				</>
			</Ariakit.Select>
			<Ariakit.SelectPopover
				gutter={4}
				className="flex flex-col items-center gap-1 rounded-lg border border-[#E4EDEB] bg-[rgba(245,250,249,0.50)] p-1 text-[#4B5563] disabled:cursor-not-allowed disabled:text-opacity-60 dark:border-[#2d2d2d] dark:bg-[rgba(43,43,43,0.50)] dark:text-white"
			>
				{chains.map((chain) => {
					return (
						<Ariakit.SelectItem
							className="mr-auto flex cursor-pointer items-center gap-2 rounded-lg p-2"
							key={chain.name}
							value={chain.name}
						>
							<span className="h-4 w-4 rounded-full">
								{chain && logos[chain.id] ? (
									<img src={logos[chain.id]} alt="" className="h-4 w-4 rounded-full" />
								) : null}
							</span>
							<span>{chain ? formatName(chain.name) : ""}</span>
						</Ariakit.SelectItem>
					);
				})}
			</Ariakit.SelectPopover>
		</Ariakit.SelectProvider>
	);
};

const formatName = (name: string) => (name === "OP Mainnet" ? "Optimism" : name);
