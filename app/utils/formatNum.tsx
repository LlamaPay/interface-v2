export function formatNum(num: number | null, fixed: number) {
	if (!num && num !== 0) return null;
	const re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
	return num.toString().match(re)?.[0] ?? null;
}
