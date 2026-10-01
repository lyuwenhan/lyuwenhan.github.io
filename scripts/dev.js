const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const {
	spawn
} = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PAGES = path.join(DIST, "pages");
const CACHE = path.join(DIST, ".cache");
const PORT = 5670;
let isProcessing = false;
let hasUpdate = false;
let isMoving = false;
let activeReads = 0;
let moveWaiters = [];
let readDrainWaiters = [];
let currentBuildChild = null;
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

function interruptBuild() {
	if (currentBuildChild && !currentBuildChild.killed) {
		currentBuildChild.kill()
	}
}

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			...options
		});
		currentBuildChild = child;

		function clearChild() {
			if (currentBuildChild === child) {
				currentBuildChild = null
			}
		}
		child.once("error", error => {
			clearChild();
			if (hasUpdate) {
				reject(new BuildInterruptedError);
				return
			}
			reject(error)
		});
		child.once("exit", (code, signal) => {
			clearChild();
			if (hasUpdate) {
				reject(new BuildInterruptedError);
				return
			}
			if (code === 0) {
				resolve()
			} else if (signal) {
				reject(new Error(`${command} terminated by signal ${signal}`))
			} else {
				reject(new Error(`${command} exited with code ${code}`))
			}
		})
	})
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
async function copySource(target) {
	const entries = await fsp.readdir(ROOT, {
		withFileTypes: true
	});
	throwIfUpdated();
	for (const entry of entries) {
		if (entry.name === "dist" || entry.name === ".git" || entry.name === "node_modules") {
			continue
		}
		throwIfUpdated();
		const source = path.join(ROOT, entry.name);
		const destination = path.join(target, entry.name);
		await fsp.cp(source, destination, {
			recursive: true
		});
		throwIfUpdated()
	}
}
async function buildToCache() {
	console.log(`Building ${path.relative(ROOT,CACHE)}`);
	throwIfUpdated();
	await fsp.rm(CACHE, {
		recursive: true,
		force: true
	});
	throwIfUpdated();
	await fsp.mkdir(CACHE, {
		recursive: true
	});
	throwIfUpdated();
	await copySource(CACHE);
	throwIfUpdated();
	await run(process.execPath, ["scripts/index.js"], {
		cwd: CACHE
	});
	throwIfUpdated();
	console.log(`Built ${path.relative(ROOT,CACHE)}`)
}
async function publishCache() {
	throwIfUpdated();
	await beginMove();
	try {
		throwIfUpdated();
		await fsp.rm(PAGES, {
			recursive: true,
			force: true
		});
		throwIfUpdated();
		await fsp.rename(CACHE, PAGES);
		console.log(`Published ${path.relative(ROOT,PAGES)}`)
	} finally {
		endMove()
	}
}
async function processUpdate() {
	if (isProcessing) {
		hasUpdate = true;
		interruptBuild();
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
		interruptBuild();
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
	startServer();
	startWatcher()
}
main().catch(error => {
	console.error(error);
	process.exit(1)
});
