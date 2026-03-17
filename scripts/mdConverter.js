const MarkdownIt = require("markdown-it");
const md = new MarkdownIt({
	highlight(str, lang) {
		const safeLang = typeof lang === "string" && /^[a-z0-9_-]+$/i.test(lang) ? lang.toLowerCase() : "";
		const className = safeLang ? `language-${safeLang}` : "language-none";
		return `<pre class="line-numbers"><code class="${className}">${md.utils.escapeHtml(str)}</code></pre>`
	}
});
const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
	return self.renderToken(tokens, idx, options)
};
md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
	const classIndex = tokens[idx].attrIndex("class");
	if (classIndex < 0) {
		tokens[idx].attrPush(["class", "bt"])
	} else {
		tokens[idx].attrs[classIndex][1] += " bt"
	}
	return defaultLinkOpen(tokens, idx, options, env, self)
};
md.renderer.rules.code_inline = function(tokens, idx, options, env, self) {
	const classIndex = tokens[idx].attrIndex("class");
	if (classIndex < 0) {
		tokens[idx].attrPush(["class", "inline-code"])
	} else {
		tokens[idx].attrs[classIndex][1] += " inline-code"
	}
	return `<code${self.renderAttrs(tokens[idx])}>${md.utils.escapeHtml(tokens[idx].content)}</code>`
};
module.exports = function mdToHtml(markdown) {
	return md.render(String(markdown))
};
