export const formatAddress = (add?: string) =>
	add ? `${add.slice(0, 5)}...${add.slice(-4)}` : null;
