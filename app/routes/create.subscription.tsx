import { Link } from "@remix-run/react";
import { useState } from "react";

import { Icon } from "~/components/Icon";
import { DAI_OPTIMISM } from "~/lib/constants";

export default function Create() {
	const [receiver, setReceiver] = useState("");
	const [amount, setAmount] = useState("");
	const [bgColor, setBgColor] = useState("#23BF91");
	const url = `https://subscriptions.llamapay.io/subscribe?to=${receiver}&amount=${amount}&brandColor=${encodeURIComponent(
		bgColor,
	)}`;
	return (
		<main className="relative mx-auto flex w-full max-w-[450px] flex-col gap-5 px-4 py-9 md:-left-[102px]">
			<Link
				to="/"
				className="flex items-center gap-1 text-[#70757d] dark:text-[#9CA3AF]"
			>
				<Icon name="arrow-left-sm" className="h-4 w-4 flex-shrink-0" />
				<span>Dashboard</span>
			</Link>

			<form className="flex flex-col gap-4">
				<h1 className="mb-4 text-center text-xl font-medium">
					Create A Subscription Page
				</h1>
				<label className="relative flex flex-col gap-1">
					<span>Receiver Address</span>
					<input
						name="receiver"
						className="rounded-lg border border-black/[0.15]  bg-[#ffffff] p-3 dark:border-white/5 dark:bg-[#141414]"
						placeholder="0x..."
						required
						autoComplete="off"
						autoCorrect="off"
						type="text"
						spellCheck="false"
						value={receiver}
						onChange={(e) => setReceiver(e.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span>Subscription Amount Per Month</span>
					<span className="relative">
						<input
							name="amount"
							className="w-full rounded-lg border border-black/[0.15]  bg-[#ffffff] p-3 pr-14 dark:border-white/5 dark:bg-[#141414]"
							required
							autoComplete="off"
							autoCorrect="off"
							type="text"
							pattern="^[0-9]*[.,]?[0-9]*$"
							placeholder="0.0"
							minLength={1}
							maxLength={79}
							spellCheck="false"
							inputMode="decimal"
							title="Enter numbers only."
							value={amount}
							onChange={(e) => {
								if (!Number.isNaN(Number(e.target.value))) {
									setAmount(e.target.value.trim());
								}
							}}
						/>
						<span className="absolute bottom-0 right-3 top-0 my-auto flex items-center justify-center gap-1">
							<img src={DAI_OPTIMISM.img} width={16} height={16} alt="" />
							<span>DAI</span>
						</span>
					</span>
				</label>

				<label className="flex cursor-pointer flex-col gap-1">
					<span>Brand Color</span>
					<span className="flex w-full items-center gap-2 rounded-lg border border-black/[0.15] bg-[#ffffff] p-3 dark:border-white/5 dark:bg-[#141414]">
						<input
							type="color"
							name="backgroundColor"
							className="h-[1.875rem] w-[1.875rem]"
							value={bgColor}
							onChange={(e) => {
								setBgColor(e.target.value);
							}}
						/>

						<p className="flex-1">{bgColor}</p>
					</span>
				</label>

				<p className="flex flex-col gap-1">
					<span>Subscription URL</span>
					<span className="w-full break-all rounded-lg border border-black/[0.15]  bg-black/10 p-3 dark:border-white/5 dark:bg-white/10">
						{url}
					</span>
				</p>

				<Link
					to={url}
					className="flex flex-nowrap items-center justify-center gap-1 rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black"
				>
					<span>Try it out</span>
					<Icon name="arrow-up-right" className="h-4 w-4" />
				</Link>
			</form>
		</main>
	);
}
