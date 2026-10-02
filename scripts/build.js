const fs = require("fs");
const path = require("path");
const mdConverter = require("./mdConverter");
const createLinks = require("./createLinks");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PAGES = path.join(DIST, "pages");
const CACHE = path.join(DIST, ".cache");
const WATCH = process.argv.includes("--watch");
const COPY_EXCLUDES = new Set([".github", ".git", ".gitignore", ".vscode", "dist", "node_modules", "package.json", "package-lock.json"]);
let isProcessing = false;
let hasUpdate = false;
class BuildInterruptedError extends Error {
	constructor() {
		super("Build interrupted by source update");
		this.name = "BuildInterruptedError"
	}
}

function throwIfUpdated() {
	if (hasUpdate) {
		throw new BuildInterruptedError
	}
}
async function checkpoint() {
	await new Promise(resolve => {
		setImmediate(resolve)
	});
	throwIfUpdated()
}
async function exists(p) {
	try {
		await fs.promises.access(p);
		return true
	} catch {
		return false
	}
}
async function copySource(target) {
	await checkpoint();
	const entries = await fs.promises.readdir(ROOT, {
		withFileTypes: true
	});
	for (const entry of entries) {
		if (COPY_EXCLUDES.has(entry.name)) {
			continue
		}
		const source = path.join(ROOT, entry.name);
		const destination = path.join(target, entry.name);
		await fs.promises.cp(source, destination, {
			recursive: true
		})
	}
}

function replaceNav(html, nav) {
	return html.replace(/(<div\s+id="nav"[^>]*>)[\s\S]*?(<\/div>)/g, `$1\n${nav}\n$2`)
}

function replaceTemplate(html, options) {
	const {
		title,
		head,
		content,
		source,
		mainClass,
		backBreak
	} = {
		title: "",
		head: "",
		content: "",
		source: "",
		mainClass: "",
		backBreak: true,
		...options
	};
	const mainClassText = mainClass ? " " + mainClass : "";
	const backBreakText = backBreak ? "<br>\n" : "\n";
	return html.replace("@title", title).replace(" @mainClass", mainClassText).replace("\x3c!-- @head --\x3e", head).replace("\x3c!-- @content --\x3e", `<a href=".." class="bt">Back</a>${backBreakText}` + (source ? `<a href="${source}" class="bt" target="_blank">Source file</a><br>\n` : "") + content)
}
async function moveExtensionData(extensionPath) {
	await checkpoint();
	const dataPath = path.join(extensionPath, "data");
	if (!await exists(dataPath)) {
		return
	}
	const assetsPath = path.join(dataPath, "assets");
	if (await exists(assetsPath)) {
		const assetEntries = await fs.promises.readdir(assetsPath);
		for (const name of assetEntries) {
			const source = path.join(assetsPath, name);
			const destination = path.join(extensionPath, name);
			await fs.promises.rm(destination, {
				recursive: true,
				force: true
			});
			await fs.promises.rename(source, destination)
		}
		await fs.promises.rm(assetsPath, {
			recursive: true,
			force: true
		})
	}
	const dataEntries = await fs.promises.readdir(dataPath, {
		withFileTypes: true
	});
	for (const entry of dataEntries) {
		const source = path.join(dataPath, entry.name);
		const destination = path.join(extensionPath, entry.name);
		await fs.promises.rm(destination, {
			recursive: true,
			force: true
		});
		await fs.promises.rename(source, destination)
	}
	await fs.promises.rm(dataPath, {
		recursive: true,
		force: true
	})
}
async function createAssetIndexPages(template, markdownHead, extensionName, data, ext) {
	const assetsPath = path.join(CACHE, "extensions", extensionName, "data", "assets");
	if (!await exists(assetsPath)) {
		return
	}
	for (const [name, value] of Object.entries(data)) {
		await checkpoint();
		if (!name || name === "data") {
			continue
		}
		const assetPath = path.join(assetsPath, name);
		if (!await exists(assetPath)) {
			continue
		}
		const content = createLinks.createLink(data, extensionName, name, ext);
		if (!content) {
			continue
		}
		let readmeContent = "";
		const readmePath = path.join(assetPath, "README", "README.md");
		if (await exists(readmePath)) {
			readmeContent = mdConverter(await fs.promises.readFile(readmePath, "utf8"))
		} else {
			readmeContent = `<h1>${value.displayName}</h1><span>${value.description}</span>`
		}
		const page = replaceTemplate(template, {
			title: value.displayName,
			head: markdownHead,
			content: content + readmeContent,
			mainClass: "verticalContainer",
			backBreak: false
		});
		await fs.promises.writeFile(path.join(assetPath, "index.html"), page)
	}
}
async function buildPages() {
	await checkpoint();
	const template_nav = await fs.promises.readFile(path.join(CACHE, "template", "nav.html"), "utf8");
	const template = replaceNav(await fs.promises.readFile(path.join(CACHE, "template", "template.html"), "utf8"), template_nav);
	const markdown_assets = await fs.promises.readFile(path.join(CACHE, "template", "markdown-assets.html"), "utf8");
	const action = {
		".html": async p => {
			const absolutePath = path.join(CACHE, p);
			const html = replaceNav(await fs.promises.readFile(absolutePath, "utf8"), template_nav);
			await fs.promises.writeFile(absolutePath, html)
		},
		".md": async p => {
			const absolutePath = path.join(CACHE, p);
			let html = await fs.promises.readFile(absolutePath, "utf8");
			const dir = path.dirname(p);
			const base = path.basename(p, ".md");
			const pagePath = p.split(path.sep).join("/");
			const discardSource = /^extensions\/[^/]+\/data\/assets\/.*\/README\//.test(pagePath);
			let outputs = [path.join(CACHE, dir, base + ".html")];
			if (base === "README") {
				outputs.push(path.join(CACHE, dir, "index.html"))
			}
			const filtered = [];
			for (const output of outputs) {
				if (!await exists(output)) {
					filtered.push(output)
				}
			}
			outputs = filtered;
			if (!outputs.length) {
				return
			}
			html = replaceTemplate(template, {
				title: base.replace(/_/g, " "),
				head: markdown_assets,
				content: mdConverter(html),
				source: discardSource ? "" : "/" + pagePath
			});
			for (const output of outputs) {
				await fs.promises.writeFile(output, html)
			}
		}
	};
	async function walk(dir) {
		await checkpoint();
		const entries = await fs.promises.readdir(path.join(CACHE, dir), {
			withFileTypes: true
		});
		for (const entry of entries) {
			const p = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(p)
			} else if (entry.isFile()) {
				const ext = path.extname(p);
				const handler = action[ext];
				if (handler) {
					await handler(p)
				}
			}
		}
	}
	await fs.promises.copyFile(path.join(CACHE, "LICENSE"), path.join(CACHE, "LICENSE.txt"));
	const extensionsPath = path.join(CACHE, "extensions");
	const extensions = await fs.promises.readdir(extensionsPath, {
		withFileTypes: true
	});
	for (const entry of extensions) {
		await checkpoint();
		if (!entry.isDirectory()) {
			continue
		}
		const absoluteHtmlPath = path.join(CACHE, "extensions", entry.name, "index.html");
		const absoluteDataPath = path.join(CACHE, "extensions", entry.name, "data", "versions.json");
		if (!await exists(absoluteHtmlPath) || !await exists(absoluteDataPath)) {
			continue
		}
		const content = await fs.promises.readFile(absoluteHtmlPath, "utf8");
		const data = JSON.parse(await fs.promises.readFile(absoluteDataPath, "utf8"));
		const ext = data.data?.ext || "zip";
		await fs.promises.writeFile(absoluteHtmlPath, content.replace("\x3c!-- @links --\x3e", createLinks(data, entry.name, ext)));
		await createAssetIndexPages(template, markdown_assets, entry.name, data, ext)
	}
	await walk(".");
	for (const entry of extensions) {
		if (entry.isDirectory()) {
			await moveExtensionData(path.join(extensionsPath, entry.name))
		}
	}
}
async function buildToCache() {
	console.log(`Building dist/.cache`);
	await checkpoint();
	await fs.promises.rm(CACHE, {
		recursive: true,
		force: true
	});
	await fs.promises.mkdir(CACHE, {
		recursive: true
	});
	await copySource(CACHE);
	await buildPages();
	await fs.promises.rm(path.join(CACHE, "template"), {
		recursive: true,
		force: true
	});
	console.log(`Built dist/.cache`)
}
async function publishCache() {
	await fs.promises.rm(PAGES, {
		recursive: true,
		force: true
	});
	await fs.promises.rename(CACHE, PAGES);
	console.log(`Published ${path.relative(ROOT,PAGES)}`);
	throwIfUpdated()
}
async function processUpdate() {
	if (isProcessing) {
		hasUpdate = true;
		return
	}
	isProcessing = true;
	do {
		hasUpdate = false;
		try {
			await buildToCache();
			throwIfUpdated();
			await publishCache();
			await checkpoint()
		} catch (error) {
			if (error instanceof BuildInterruptedError) {
				console.log("Build interrupted, restarting...")
			} else {
				console.error("Build failed:");
				console.error(error);
				try {
					await fs.promises.rm(CACHE, {
						recursive: true,
						force: true
					})
				} catch {}
			}
		}
	} while (hasUpdate);
	isProcessing = false
}

function sourceChanged(filename) {
	if (!filename) {
		return
	}
	const relative = filename.toString();
	const first = relative.split(path.sep)[0];
	if (first === "dist" || first === ".git" || first === "node_modules") {
		return
	}
	if (isProcessing) {
		if (!hasUpdate) {
			console.log(`Changed ${relative}`);
			console.log("Interrupting current build...");
			hasUpdate = true
		}
		return
	}
	console.log(`Changed ${relative}`);
	processUpdate()
}

function startWatcher() {
	fs.watch(ROOT, {
		recursive: true
	}, (_event, filename) => {
		sourceChanged(filename)
	});
	console.log("Watching files...")
}
async function main() {
	console.log("Starting...");
	await fs.promises.mkdir(DIST, {
		recursive: true
	});
	await buildToCache();
	await publishCache();
	if (!WATCH) {
		return
	}
	startWatcher()
}
main().catch(error => {
	console.error(error);
	process.exit(1)
});
