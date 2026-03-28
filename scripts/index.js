const fs = require("fs");
const path = require("path");
const nav = fs.readFileSync("nav.html", "utf8");
const mdConverter = require("./mdConverter");
const createLinks = require("./createLinks");

function replaceNav(s) {
	return s.replace(/(<div\s+id="nav"[^>]*>)[\s\S]*?(<\/div>)/g, `$1\n${nav}\n$2`)
}
const template = replaceNav(fs.readFileSync("template/template.html", "utf8"));
const markdown_js = replaceNav(fs.readFileSync("template/markdown.js.html", "utf8"));
const markdown_css = replaceNav(fs.readFileSync("template/markdown.css.html", "utf8"));

function replaceTemplate(s, options) {
	const {
		title,
		head,
		content,
		body,
		source,
		back
	} = {
		title: "",
		head: "",
		content: "",
		body: "",
		source: "",
		back: "..",
		...options
	};
	return s.replace("@title", title).replace("\x3c!-- @head --\x3e", head).replace("\x3c!-- @content --\x3e", `<a href="${back}" class="bt">Back</a><br>\n` + (source ? `<a href="${source}" class="bt" target="_blank">Source file</a><br>\n` : "") + content).replace("\x3c!-- @body --\x3e", body)
}
const action = {
	".html": p => {
		let s = fs.readFileSync(p, "utf8");
		s = replaceNav(s);
		fs.writeFileSync(p, s)
	},
	".md": p => {
		let s = fs.readFileSync(p, "utf8");
		const dir = path.dirname(p);
		const base = path.basename(p, ".md");
		let out = [path.join(dir, base + ".html")];
		if (base === "README") {
			out.push(path.join(dir, "index.html"))
		}
		out = out.filter(p => !fs.existsSync(p));
		if (!out.length) {
			return
		}
		s = replaceTemplate(template, {
			title: base.replace(/_/g, " "),
			head: markdown_js + markdown_css,
			content: mdConverter(s),
			body: "",
			source: "/" + p,
			back: /^\extensions\/[a-zA-Z\d_\-]+\/data\//.test(p) ? p.replace(/^(\extensions\/[a-zA-Z\d_\-]+)\/.*$/, "/$1") : ".."
		});
		out.forEach(p => fs.writeFileSync(p, s))
	}
};

function walk(dir) {
	for (const entry of fs.readdirSync(dir, {
			withFileTypes: true
		})) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(p)
		} else if (entry.isFile()) {
			const ext = path.extname(p);
			action[ext]?.(p)
		}
	}
}
fs.renameSync("extensions/minecraft-java/data/next_steps.md", "extensions/minecraft-java/next_steps.md");
fs.renameSync("LICENSE", "LICENSE.txt");
for (const entry of fs.readdirSync("extensions", {
		withFileTypes: true
	}) || []) {
	if (!entry.isDirectory()) {
		continue
	}
	const htmlPath = path.join("extensions", entry.name, "index.html");
	const dataPath = path.join("extensions", entry.name, "data", "versions.json");
	if (!fs.existsSync(htmlPath) || !fs.existsSync(dataPath)) {
		continue
	}
	const content = fs.readFileSync(htmlPath, "utf8");
	const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
	fs.writeFileSync(htmlPath, content.replace("\x3c!-- @links --\x3e", createLinks(data, entry.name, data.data?.ext || "zip")))
}
walk(".");
