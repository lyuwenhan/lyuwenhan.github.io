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
let cleanupStarted = false;
let moveWaiters = [];
let readDrainWaiters = [];

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			...options
		});
		child.once("error", reject);
		child.once("exit", code => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`${command} exited with code ${code}`))
			}
		})
	})
}
async function cleanup() {
	if (cleanupStarted) {
		return
	}
	cleanupStarted = true;
	console.log("Cleaning dist...");
	try {
		await fsp.rm(DIST, {
			recursive: true,
			force: true
		})
	} catch (error) {
		console.error(error.message)
	}
}

function registerExitHandlers() {
	const exit = async code => {
		await cleanup();
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
	});
	process.once("exit", () => {
		try {
			fs.rmSync(DIST, {
				recursive: true,
				force: true
			})
		} catch {}
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
	for (const entry of entries) {
		if (entry.name === "dist" || entry.name === ".git" || entry.name === "node_modules") {
			continue
		}
		const source = path.join(ROOT, entry.name);
		const destination = path.join(target, entry.name);
		await fsp.cp(source, destination, {
			recursive: true
		})
	}
}
async function buildToCache() {
	console.log(`Building ${path.relative(ROOT,CACHE)}`);
	await fsp.rm(CACHE, {
		recursive: true,
		force: true
	});
	await fsp.mkdir(CACHE, {
		recursive: true
	});
	await copySource(CACHE);
	await run(process.execPath, ["scripts/index.js"], {
		cwd: CACHE
	});
	console.log(`Built ${path.relative(ROOT,CACHE)}`)
}
async function publishCache() {
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
				await publishCache()
			} catch (error) {
				console.error("Build failed:");
				console.error(error);
				try {
					await fsp.rm(CACHE, {
						recursive: true,
						force: true
					})
				} catch {}
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
	clearTimeout(changeTimer);
	changeTimer = setTimeout(() => {
		console.log(`Changed ${relative}`);
		if (isProcessing) {
			hasUpdate = true
		} else {
			processUpdate()
		}
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
