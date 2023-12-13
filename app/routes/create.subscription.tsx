import { Link } from "@remix-run/react";
import { useState } from "react";

import { DAI_OPTIMISM } from "~/lib/constants";

export default function Create() {
	const [receiver, setReceiver] = useState("");
	const [amount, setAmount] = useState("");
	const url = `https://llamapay.io/subscribe?address=${receiver}&amount=${amount}`;
	return (
		<main className="relative mx-auto flex w-full max-w-[450px] flex-col gap-5 px-4 py-9 md:-left-[102px]">
			{/* <Link to="/" className="text-[#9CA3AF]">
				Dashboard
			</Link> */}

			<form className="flex flex-col gap-4">
				<label className="relative flex flex-col gap-1">
					<span>Receiver Address</span>
					<input
						name="receiver"
						className="border-black/8 rounded-lg border  bg-[#ffffff] p-3 dark:border-white/5 dark:bg-[#141414]"
						placeholder="0x..."
						required
						value={receiver}
						onChange={(e) => setReceiver(e.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span>Subscription Amount Per Month</span>
					<span className="relative">
						<input
							name="amount"
							className="border-black/8 w-full rounded-lg border  bg-[#ffffff] p-3 pr-14 dark:border-white/5 dark:bg-[#141414]"
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

				<p className="flex flex-col gap-1">
					<span>Subscription URL</span>
					<span className="border-black/8 w-full rounded-lg border  bg-[#ffffff] p-3 dark:border-white/5 dark:bg-[#141414]">
						{url}
					</span>
				</p>

				<button
					type="button"
					onClick={() => {
						navigator.clipboard.writeText(url ?? "");
					}}
					className="rounded-lg bg-[#13785a] p-3 text-white dark:text-black"
				>
					Copy
				</button>
			</form>
		</main>
	);
}
