import { Link, useLocation } from "@remix-run/react";

export const Nav = () => {
	const location = useLocation();

	return (
		<nav className="hidden h-full w-full flex-col gap-3 px-8 py-9 md:flex">
			<Link
				to="/"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
				data-active={location.pathname === "/"}
			>
				Dashboard
			</Link>
			{/* <Link
				to="/subscribe-to"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
				data-active={location.pathname === "/subscribe-to"}
			>
				Subscribe
			</Link> */}
			{/* <Link
				to="/incoming"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
				data-active={location.pathname === "/incoming"}
			>
				Incoming
			</Link>
			<Link
				to="/outgoing"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
				data-active={location.pathname === "/outgoing"}
			>
				Outgoing
			</Link> */}
			<hr className="border-black/[0.15] dark:border-white/[0.15]" />
			<a
				href="https://docs.llamapay.io/"
				target="_blank"
				rel="noreferrer noopener"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
			>
				Docs
			</a>
			{/* <a
				href="https://github.com/banteg/ape-llamapay"
				target="_blank"
				rel="noreferrer noopener"
				className="font-semibold text-black data-[active=true]:text-[#13785a] dark:text-white dark:data-[active=true]:text-[#23BF91]"
			>
				Gnosis Safe
			</a> */}
		</nav>
	);
};
