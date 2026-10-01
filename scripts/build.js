const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const mdConverter = require("./mdConverter");
const createLinks = require("./createLinks");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PAGES = path.join(DIST, "pages");
const CACHE = path.join(DIST, ".cache");
const PORT = 5670;
const WATCH = process.argv.includes("--watch");
const COPY_EXCLUDES = new Set([".github", ".git", ".gitignore", ".vscode", "dist", "node_modules", "package.json", "package-lock.json"]);
const OUTPUT_CLEANUP = ["nav.html", "template"];
let isProcessing = false;
let hasUpdate = false;
let isMoving = false;
let activeReads = 0;
let moveWaiters = [];
let readDrainWaiters = [];
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
	throwIfUpdated();
	await new Promise(resolve => {
		setImmediate(resolve)
	});
	throwIfUpdated()
}

function registerExitHandlers() {
	const exit = code => {
		process.exit(code)
	};
	process.once("SIGINT", () => exit(0));
	process.once("SIGTERM", () => exit(0));
	process.on("uncaughtException", error => {
		console.error(error);
		exit(1)
	});
	process.on("unhandledRejection", error => {
		console.error(error);
		exit(1)
	})
}

function waitForMoveFinished() {
	if (!isMoving) {
		return Promise.resolve()
	}
	return new Promise(resolve => {
		moveWaiters.push(resolve)
	})
}

function waitForReadsDrained() {
	if (activeReads === 0) {
		return Promise.resolve()
	}
	return new Promise(resolve => {
		readDrainWaiters.push(resolve)
	})
}
async function beginRead() {
	await waitForMoveFinished();
	activeReads++
}

function endRead() {
	activeReads--;
	if (activeReads < 0) {
		activeReads = 0
	}
	if (activeReads === 0) {
		const waiters = readDrainWaiters;
		readDrainWaiters = [];
		for (const resolve of waiters) {
			resolve()
		}
	}
}
async function beginMove() {
	isMoving = true;
	await waitForReadsDrained()
}

function endMove() {
	isMoving = false;
	const waiters = moveWaiters;
	moveWaiters = [];
	for (const resolve of waiters) {
		resolve()
	}
}
async function exists(p) {
	try {
		await fsp.access(p);
		return true
	} catch {
		return false
	}
}
async function copySource(target) {
	const entries = await fsp.readdir(ROOT, {
		withFileTypes: true
	});
	await checkpoint();
	for (const entry of entries) {
		if (COPY_EXCLUDES.has(entry.name)) {
			continue
		}
		await checkpoint();
		const source = path.join(ROOT, entry.name);
		const destination = path.join(target, entry.name);
		await fsp.cp(source, destination, {
			recursive: true
		});
		await checkpoint()
	}
}

function replaceNav(s, nav) {
	return s.replace(/(<div\s+id="nav"[^>]*>)[\s\S]*?(<\/div>)/g, `$1\n${nav}\n$2`)
}

function replaceTemplate(s, options) {
	const {
		title,
		head,
		content,
		body,
		source,
		back,
		mainClass,
		backBreak
	} = {
		title: "",
		head: "",
		content: "",
		body: "",
		source: "",
		back: "..",
		mainClass: "",
		backBreak: true,
		...options
	};
	const mainClassText = mainClass ? " " + mainClass : "";
	const backBreakText = backBreak ? "<br>\n" : "\n";
	return s.replace("@title", title).replace(" @mainClass", mainClassText).replace("\x3c!-- @head --\x3e", head).replace("\x3c!-- @content --\x3e", `<a href="${back}" class="bt">Back</a>${backBreakText}` + (source ? `<a href="${source}" class="bt" target="_blank">Source file</a><br>\n` : "") + content).replace("\x3c!-- @body --\x3e", body)
}
async function movePath(source, destination) {
	await checkpoint();
	const sourceStat = await fsp.lstat(source);
	if (sourceStat.isDirectory()) {
		if (await exists(destination)) {
			const destinationStat = await fsp.lstat(destination);
			if (destinationStat.isDirectory()) {
				const entries = await fsp.readdir(source, {
					withFileTypes: true
				});
				for (const entry of entries) {
					await movePath(path.join(source, entry.name), path.join(destination, entry.name))
				}
				await checkpoint();
				await fsp.rmdir(source);
				return
			}
			await fsp.rm(destination, {
				recursive: true,
				force: true
			})
		} else {
			await fsp.mkdir(path.dirname(destination), {
				recursive: true
			})
		}
		await checkpoint();
		await fsp.rename(source, destination);
		return
	}
	await fsp.mkdir(path.dirname(destination), {
		recursive: true
	});
	await fsp.rm(destination, {
		recursive: true,
		force: true
	});
	await checkpoint();
	await fsp.rename(source, destination)
}
async function moveExtensionData(extensionPath) {
	await checkpoint();
	const dataPath = path.join(extensionPath, "data");
	if (!await exists(dataPath)) {
		return
	}
	const assetsPath = path.join(dataPath, "assets");
	if (await exists(assetsPath)) {
		const assetEntries = await fsp.readdir(assetsPath, {
			withFileTypes: true
		});
		for (const entry of assetEntries) {
			await movePath(path.join(assetsPath, entry.name), path.join(extensionPath, entry.name))
		}
	}
	const dataEntries = await fsp.readdir(dataPath, {
		withFileTypes: true
	});
	for (const entry of dataEntries) {
		if (entry.name === "assets") {
			continue
		}
		await movePath(path.join(dataPath, entry.name), path.join(extensionPath, entry.name))
	}
	await checkpoint();
	await fsp.rm(dataPath, {
		recursive: true,
		force: true
	})
}
async function createAssetIndexPages(template, markdownHead, extensionName, data, ext) {
	await checkpoint();
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
			await checkpoint();
			readmeContent = `<div class="extensionDescription">${mdConverter(await fsp.readFile(readmePath,"utf8"))}</div>`
		}
		const page = replaceTemplate(template, {
			title: value.displayName ?? name,
			head: readmeContent ? markdownHead : "",
			content: content + readmeContent,
			body: "",
			source: "",
			back: "..",
			mainClass: "verticalContainer",
			backBreak: false
		});
		await checkpoint();
		await fsp.writeFile(path.join(assetPath, "index.html"), page);
		await checkpoint()
	}
}
async function buildPages() {
	await checkpoint();
	const nav = await fsp.readFile(path.join(CACHE, "nav.html"), "utf8");
	await checkpoint();
	const template = replaceNav(await fsp.readFile(path.join(CACHE, "template", "template.html"), "utf8"), nav);
	await checkpoint();
	const markdown_js = await fsp.readFile(path.join(CACHE, "template", "markdown.js.html"), "utf8");
	await checkpoint();
	const markdown_css = await fsp.readFile(path.join(CACHE, "template", "markdown.css.html"), "utf8");
	await checkpoint();
	const action = {
		".html": async p => {
			await checkpoint();
			const absolutePath = path.join(CACHE, p);
			let s = await fsp.readFile(absolutePath, "utf8");
			await checkpoint();
			s = replaceNav(s, nav);
			await fsp.writeFile(absolutePath, s);
			await checkpoint()
		},
		".md": async p => {
			await checkpoint();
			const absolutePath = path.join(CACHE, p);
			let s = await fsp.readFile(absolutePath, "utf8");
			await checkpoint();
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
				await checkpoint();
				if (!await exists(output)) {
					filtered.push(output)
				}
			}
			outputs = filtered;
			if (!outputs.length) {
				return
			}
			await checkpoint();
			s = replaceTemplate(template, {
				title: base.replace(/_/g, " "),
				head: markdown_js + markdown_css,
				content: mdConverter(s),
				body: "",
				source: discardSource ? "" : "/" + pagePath,
				back: ".."
			});
			await checkpoint();
			for (const output of outputs) {
				await checkpoint();
				await fsp.writeFile(output, s);
				await checkpoint()
			}
		}
	};
	async function walk(dir) {
		await checkpoint();
		const entries = await fsp.readdir(path.join(CACHE, dir), {
			withFileTypes: true
		});
		await checkpoint();
		for (const entry of entries) {
			await checkpoint();
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
	await fsp.copyFile(path.join(CACHE, "LICENSE"), path.join(CACHE, "LICENSE.txt"));
	await checkpoint();
	const extensionsPath = path.join(CACHE, "extensions");
	const extensions = await fsp.readdir(extensionsPath, {
		withFileTypes: true
	});
	await checkpoint();
	for (const entry of extensions) {
		await checkpoint();
		if (!entry.isDirectory()) {
			continue
		}
		const htmlPath = path.join("extensions", entry.name, "index.html");
		const dataPath = path.join("extensions", entry.name, "data", "versions.json");
		const absoluteHtmlPath = path.join(CACHE, htmlPath);
		const absoluteDataPath = path.join(CACHE, dataPath);
		if (!await exists(absoluteHtmlPath) || !await exists(absoluteDataPath)) {
			continue
		}
		await checkpoint();
		const content = await fsp.readFile(absoluteHtmlPath, "utf8");
		await checkpoint();
		const data = JSON.parse(await fsp.readFile(absoluteDataPath, "utf8"));
		await checkpoint();
		const ext = data.data?.ext || "zip";
		await fsp.writeFile(absoluteHtmlPath, content.replace("\x3c!-- @links --\x3e", createLinks(data, entry.name, ext)));
		await checkpoint();
		await createAssetIndexPages(template, markdown_js + markdown_css, entry.name, data, ext);
		await checkpoint()
	}
	await walk(".");
	for (const entry of extensions) {
		await checkpoint();
		if (entry.isDirectory()) {
			await moveExtensionData(path.join(extensionsPath, entry.name))
		}
	}
}
async function cleanupOutput(target) {
	for (const entry of OUTPUT_CLEANUP) {
		await checkpoint();
		await fsp.rm(path.join(target, entry), {
			recursive: true,
			force: true
		})
	}
	await checkpoint()
}
async function buildToCache() {
	console.log(`Building ${path.relative(ROOT,CACHE)}`);
	await checkpoint();
	await fsp.rm(CACHE, {
		recursive: true,
		force: true
	});
	await checkpoint();
	await fsp.mkdir(CACHE, {
		recursive: true
	});
	await checkpoint();
	await copySource(CACHE);
	await checkpoint();
	await buildPages();
	await checkpoint();
	await cleanupOutput(CACHE);
	await checkpoint();
	console.log(`Built ${path.relative(ROOT,CACHE)}`)
}
async function publishCache() {
	throwIfUpdated();
	await beginMove();
	try {
		await fsp.rm(PAGES, {
			recursive: true,
			force: true
		});
		await fsp.rename(CACHE, PAGES);
		console.log(`Published ${path.relative(ROOT,PAGES)}`)
	} finally {
		endMove()
	}
}
async function processUpdate() {
	if (isProcessing) {
		hasUpdate = true;
		return
	}
	isProcessing = true;
	try {
		do {
			hasUpdate = false;
			try {
				await buildToCache();
				throwIfUpdated();
				await publishCache()
			} catch (error) {
				if (error instanceof BuildInterruptedError) {
					console.log("Build interrupted, restarting...")
				} else {
					console.error("Build failed:");
					console.error(error);
					try {
						await fsp.rm(CACHE, {
							recursive: true,
							force: true
						})
					} catch {}
				}
			}
		} while (hasUpdate)
	} finally {
		isProcessing = false;
		if (hasUpdate) {
			processUpdate()
		}
	}
}
let changeTimer;

function sourceChanged(filename) {
	if (!filename) {
		return
	}
	const relative = filename.toString();
	const first = relative.split(/[\\/]/)[0];
	if (first === "dist" || first === ".git" || first === "node_modules") {
		return
	}
	if (isProcessing) {
		if (!hasUpdate) {
			console.log(`Changed ${relative}`);
			console.log("Interrupting current build...")
		}
		hasUpdate = true;
		return
	}
	clearTimeout(changeTimer);
	changeTimer = setTimeout(() => {
		console.log(`Changed ${relative}`);
		processUpdate()
	}, 50)
}

function startServer() {
	const express = require("express");
	const app = express();
	const staticPages = express.static(PAGES, {
		etag: false,
		lastModified: false,
		setHeaders(res) {
			res.setHeader("Cache-Control", "no-cache")
		}
	});
	app.use(async (req, res, next) => {
		try {
			await beginRead()
		} catch (error) {
			next(error);
			return
		}
		let finished = false;

		function finishRead() {
			if (finished) {
				return
			}
			finished = true;
			endRead()
		}
		res.once("finish", finishRead);
		res.once("close", finishRead);
		staticPages(req, res, error => {
			finishRead();
			next(error)
		})
	});
	app.use((req, res) => {
		res.status(404).send("404 Not Found")
	});
	app.listen(PORT, () => {
		console.log(`Server: http://localhost:${PORT}`);
		console.log(`Serving ${path.relative(ROOT,PAGES)}`)
	})
}

function startWatcher() {
	fs.watch(ROOT, {
		recursive: true
	}, (event, filename) => {
		sourceChanged(filename)
	});
	console.log("Watching files...")
}
async function main() {
	registerExitHandlers();
	await fsp.mkdir(DIST, {
		recursive: true
	});
	await buildToCache();
	await publishCache();
	if (!WATCH) {
		return
	}
	startServer();
	startWatcher()
}
main().catch(error => {
	console.error(error);
	process.exit(1)
});
