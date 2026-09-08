import tailwind from "bun-plugin-tailwind";

await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	target: "browser",
	minify: true,
	sourcemap: "linked",
	env: "BUN_PUBLIC_*",
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	plugins: [tailwind],
});
