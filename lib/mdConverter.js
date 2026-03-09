const converter = import("/lib/mdConverterCore.js").then(mod => typeof mod.default === "function" ? mod.default : null).catch(() => null);
async function mdToHtml(md) {
	if (md instanceof Promise) {
		md = await md
	}
	return typeof md === "string" ? (await converter)?.(md) || "" : ""
}
