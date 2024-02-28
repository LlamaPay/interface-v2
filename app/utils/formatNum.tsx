export function formatNum(num: string | number | null, fixed: number) {
	if ((!num && num !== 0) || num === "") return null;
	const re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
	const final = num.toString().match(re)?.[0] ?? null;

	if (final) {
		return Number(final).toLocaleString();
	}
	return final;
}
