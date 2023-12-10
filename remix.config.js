/** @type {import('@remix-run/dev').AppConfig} */
export default {
	ignoredRouteFiles: ["**/.*"],
	browserNodeBuiltinsPolyfill: { modules: { buffer: true, events: true } }
	// appDirectory: "app",
	// assetsBuildDirectory: "public/build",
	// publicPath: "/build/",
	// serverBuildPath: "build/index.js",
};
