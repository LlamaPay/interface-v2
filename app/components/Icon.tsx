import { type ForwardedRef, type SVGProps, forwardRef } from "react";

import spriteHref from "~/assets/icons/sprite.svg";

type IconProps = SVGProps<SVGSVGElement> & {
	name: string;
};

export const Icon = forwardRef(function Icon(
	{ name, ...props }: IconProps,
	ref: ForwardedRef<SVGSVGElement>,
) {
	return (
		<svg ref={ref} {...props}>
			<use href={`${spriteHref}#${name}`} />
		</svg>
	);
});
