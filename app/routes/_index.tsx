import { Theme, useTheme } from "~/utils/theme-provider";

export default function Index() {
	const [, setTheme] = useTheme();

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
	};

	return <button onClick={toggleTheme}>Toggle</button>;
}
