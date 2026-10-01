const {
	JSDOM
} = require("jsdom");
const SOURCE_ICONS = {
	"Chrome Web Store": "chrome.svg",
	Curseforge: "curseforge.svg",
	Mcpedl: "mcpedl.png",
	"Microsoft Edge Add-ons": "edge.svg",
	Modrinth: "modrinth.svg",
	"Open VSX": "openVSX.svg",
	"Planet Minecraft": "planetMinecraft.png",
	"Visual Studio Marketplace": "vscode.svg"
};

function createHeaderElement(document, name, data, path, tagName = "div") {
	const headerEle = document.createElement(tagName);
	headerEle.classList.add("horizontalContainer");
	if (data.hasIcon) {
		const imgEle = document.createElement("img");
		imgEle.classList.add("imgPreview");
		imgEle.src = `/extensions/${path}/${name}/icon.png`;
		headerEle.append(imgEle)
	}
	const descriptionsEle = document.createElement("div");
	descriptionsEle.classList.add("verticalContainer");
	const nameEle = document.createElement("h3");
	nameEle.textContent = data.displayName ?? name;
	nameEle.classList.add("extension-name");
	descriptionsEle.append(nameEle);
	const descEle = document.createElement("span");
	descEle.textContent = data.description;
	descriptionsEle.append(descEle);
	headerEle.append(descriptionsEle);
	return headerEle
}

function appendLinkContent(ele, document, name, data, path, ext, options = {}) {
	const {
		includeFullDescription = true, includeHeaderDetails = true
	} = options;
	if (includeHeaderDetails) {
		ele.append(createHeaderElement(document, name, data, path))
	} else if (data.hasIcon) {
		const imgEle = document.createElement("img");
		imgEle.classList.add("imgPreview");
		imgEle.src = `/extensions/${path}/${name}/icon.png`;
		ele.append(imgEle)
	}
	if (includeFullDescription) {
		const fullDescEle = document.createElement("a");
		fullDescEle.href = `/extensions/${path}/${name}/README/README.html`;
		fullDescEle.textContent = `Full description`;
		fullDescEle.target = "_blank";
		fullDescEle.classList.add("bt");
		ele.append(fullDescEle)
	}
	if (data.link && Object.keys(data.link).length) {
		const sourcesEle = document.createElement("div");
		sourcesEle.classList.add("horizontalContainer");
		sourcesEle.classList.add("sourceLinks");
		const sourcesTextEle = document.createElement("span");
		sourcesTextEle.textContent = "View on:";
		sourcesEle.append(sourcesTextEle);
		Object.entries(data.link).forEach(([site, href]) => {
			const sourceEle = document.createElement("a");
			sourceEle.href = href;
			sourceEle.target = "_blank";
			sourceEle.title = site;
			sourceEle.classList.add("sourceIcon");
			const icon = SOURCE_ICONS[site];
			if (icon) {
				const imgEle = document.createElement("img");
				imgEle.src = `/lib/icons/${icon}`;
				imgEle.alt = site;
				sourceEle.append(imgEle)
			} else {
				sourceEle.textContent = site[0]
			}
			sourcesEle.append(sourceEle)
		});
		ele.append(sourcesEle)
	}
	if (data.version) {
		const versionEle = document.createElement("a");
		versionEle.href = `/extensions/${path}/dist/${name}.${ext}`;
		versionEle.textContent = `Download (version ${data.version})`;
		versionEle.download = "";
		versionEle.classList.add("bt");
		ele.append(versionEle)
	}
	if (data.versions?.length) {
		const versionsEle = document.createElement("ul");
		const downloadLi = document.createElement("li");
		const downloadText = document.createElement("span");
		downloadText.textContent = `Download:`;
		downloadLi.append(downloadText);
		versionsEle.append(downloadLi);
		const rev = data.versions.toReversed();
		rev.forEach(version => {
			const versionLi = document.createElement("li");
			const versionEle = document.createElement("a");
			versionEle.href = `/extensions/${path}/dist/${name}-${version}.${ext}`;
			versionEle.textContent = `Version ${version}`;
			versionEle.download = "";
			versionEle.classList.add("bt");
			versionLi.append(versionEle);
			versionsEle.append(versionLi)
		});
		versionsEle.children[5]?.insertAdjacentHTML("beforebegin", '<li class="lisum"><details><summary>Historical versions</summary></details></li>');
		ele.append(versionsEle)
	}
}

function createLinkElement(document, name, data, path, ext) {
	const ele = createHeaderElement(document, name, data, path, "a");
	ele.classList.add("extensionsCard");
	ele.href = `/extensions/${path}/${name}/`;
	return ele
}

function createLinks(data, path, ext) {
	const dom = new JSDOM(`<!DOCTYPE html><body><div id="links"></div></body>`);
	const document = dom.window.document;
	const linksEle = document.createElement("div");
	Object.entries(data).filter(e => e[0] && e[0] !== "data").forEach(e => {
		linksEle.append(createLinkElement(document, e[0], e[1], path, ext))
	});
	return linksEle.innerHTML
}

function createLink(data, path, name, ext) {
	if (!data[name]) {
		return ""
	}
	const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
	const content = dom.window.document.createElement("div");
	appendLinkContent(content, dom.window.document, name, data[name], path, ext, {
		includeFullDescription: false,
		includeHeaderDetails: false
	});
	return content.innerHTML
}
createLinks.createLink = createLink;
module.exports = createLinks;
