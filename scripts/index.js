const fs = require("fs");
const path = require("path");
const nav = fs.readFileSync("nav.html", "utf8");
const mdConverter = require("./mdConverter");

function replaceNav(s) {
	return s.replace(/(<div\s+id="nav"[^>]*>)[\s\S]*?(<\/div>)/g, `$1\n${nav}\n$2`)
}
const template = replaceNav(fs.readFileSync("template.html", "utf8"));

function replaceTemplate(s, options) {
	options = {
		title: "",
		head: "",
		content: "",
		body: "",
		...options
	};
	return s.replace("@title", title).replace("<!-- @head -->", head).replace("<!-- @content -->", content).replace("<!-- @body -->", body)
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
			title: base,
			head: "",
			content: mdConverter(s),
			body: ""
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
walk(".");
