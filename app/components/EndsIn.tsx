import { useEffect, useState } from "react";

export const EndsIn = ({ deadline }: { deadline: number }) => {
	const diffTime = Math.abs(new Date().valueOf() - new Date(deadline).valueOf());
	let days = diffTime / (24 * 60 * 60 * 1000);
	let hours = (days % 1) * 24;
	let minutes = (hours % 1) * 60;
	let secs = (minutes % 1) * 60;
	[days, hours, minutes, secs] = [Math.floor(days), Math.floor(hours), Math.floor(minutes), Math.floor(secs)];

	const [deadlineFormatted, setDeadline] = useState<string>("");

	useEffect(() => {
		const id = setInterval(() => {
			const diffTime = Math.abs(new Date().valueOf() - new Date(deadline).valueOf());
			let days = diffTime / (24 * 60 * 60 * 1000);
			let hours = (days % 1) * 24;
			let minutes = (hours % 1) * 60;
			let secs = (minutes % 1) * 60;
			[days, hours, minutes, secs] = [Math.floor(days), Math.floor(hours), Math.floor(minutes), Math.floor(secs)];

			setDeadline(`${days}D ${hours}H ${minutes}m ${secs < 10 ? "0" : ""}${secs}s`);
		}, 1000);

		return () => clearInterval(id);
	}, [deadline]);

	return <>{deadlineFormatted !== "" ? deadlineFormatted : `${days}D ${hours}H ${minutes}m ${secs}s`}</>;
};
