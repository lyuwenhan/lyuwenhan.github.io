import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm";
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
	highlight(str, lang) {
		const safeLang = typeof lang === "string" && /^[a-z0-9_-]+$/i.test(lang) ? lang.toLowerCase() : "";
		const className = safeLang ? `language-${safeLang}` : "language-none";
		return `<pre class="line-numbers"><code class="${className}">${md.utils.escapeHtml(str)}</code></pre>`
	}
});
const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
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
const ALLOWED_TAGS = ["a", "p", "br", "strong", "em", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "table", "thead", "tbody", "tr", "th", "td", "span", "div", "img", "del", "sup", "sub", "kbd", "mark", "details", "summary"];
const ALLOWED_ATTR = ["href", "title", "class", "src", "alt", "width", "height", "loading", "id"];
export default function mdToHtml(markdown) {
	const dirty = md.render(String(markdown));
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS,
		ALLOWED_ATTR
	})
}
