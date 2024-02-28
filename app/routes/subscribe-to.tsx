import { Link, useNavigate } from "@remix-run/react";

import { Icon } from "~/components/Icon";
import { DAI_OPTIMISM } from "~/lib/constants";

export default function Create() {
	const navigate = useNavigate();
	return (
		<main className="relative mx-auto flex w-full max-w-[450px] flex-col gap-5 px-4 py-9 md:-left-[102px]">
			<Link
				to="/"
				className="flex items-center gap-1 text-[#70757d] dark:text-[#9CA3AF]"
			>
				<Icon name="arrow-left-sm" className="h-4 w-4 flex-shrink-0" />
				<span>Dashboard</span>
			</Link>

			<form
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					const form = e.target as HTMLFormElement;
					navigate(
						`/subscribe?to=${form.receiver.value}&amount=${form.amount.value}`,
						{ replace: true },
					);
				}}
			>
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
						/>
						<span className="absolute bottom-0 right-3 top-0 my-auto flex items-center justify-center gap-1">
							<img src={DAI_OPTIMISM.img} width={16} height={16} alt="" />
							<span>DAI</span>
						</span>
					</span>
				</label>
				<button className="flex flex-nowrap items-center justify-center gap-1 rounded-lg bg-[#13785a] p-3 text-white disabled:opacity-60 dark:bg-[#23BF91] dark:text-black">
					Open
				</button>
			</form>
		</main>
	);
}
