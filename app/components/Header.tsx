import logoDark from "~/assets/icons/logo-dark.svg";
import logoLight from "~/assets/icons/logo-light.svg";
import moon from "~/assets/icons/moon.svg";
import sun from "~/assets/icons/sun.svg";
import { Theme, useTheme } from "~/utils/theme-provider";

export const Header = () => {
	const [theme, setTheme] = useTheme();
	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
	};

	return (
		<header className="flex flex-wrap items-center gap-4 border-b border-black/5 p-4 dark:border-white/5 md:px-8">
			<img src={theme === "dark" ? logoLight : logoDark} alt="" className="mr-auto h-5 md:h-10" />

			<button className="rounded-lg border border-[#E4EDEB] p-2 dark:border-[#2d2d2d]" onClick={toggleTheme}>
				<img src={theme === "dark" ? moon : sun} alt="" className="h-6" />
				<span className="sr-only"></span>
			</button>
		</header>
	);
};
