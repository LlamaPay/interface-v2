import { forwardRef, type SVGProps } from "react";

import spriteHref from "~/assets/icons/sprite.svg";

export const Icon = forwardRef(function Icon({
	name,
	...props
}: SVGProps<SVGSVGElement> & {
	name: string;
}) {
	return (
		<svg {...props}>
			<use href={`${spriteHref}#${name}`} />
		</svg>
	);
});
