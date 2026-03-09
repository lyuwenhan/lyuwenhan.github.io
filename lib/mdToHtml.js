import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm";
import hljs from "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm";
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
	highlight(str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				const highlighted = hljs.highlight(str, {
					language: lang
				}).value;
				return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
			} catch (err) {}
		}
		return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`
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
	const dirty = md.render(markdown);
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS,
		ALLOWED_ATTR
	})
}
