const {
	JSDOM
} = require("jsdom");

function createLinks(data, path, ext) {
	const dom = new JSDOM(`<!DOCTYPE html><body><div id="links"></div></body>`);
	const document = dom.window.document;
	const linksEle = document.createElement("div");
	Object.entries(data).filter(e => e[0] && e[0] !== "data").forEach(e => {
		const ele = document.createElement("details");
		ele.id = "links-" + e[0];
		ele.classList.add("linksEle");
		const sumEle = document.createElement("summary");
		const nameEle = document.createElement("h3");
		nameEle.textContent = e[1].displayName ?? e[0];
		nameEle.classList.add("extension-name");
		sumEle.append(nameEle);
		ele.append(sumEle);
		if (e[1].description) {
			const descEle = document.createElement("span");
			descEle.textContent = e[1].description;
			ele.append(descEle);
			ele.append(document.createElement("br"))
		}
		if (e[1].hasIcon) {
			const imgEle = document.createElement("img");
			imgEle.classList.add("imgPreview");
			imgEle.src = `/extensions/${path}/data/assets/${e[0]}/icon.png`;
			ele.append(imgEle);
			ele.append(document.createElement("br"))
		}
		const fullDescEle = document.createElement("a");
		fullDescEle.href = `/extensions/${path}/data/assets/${e[0]}/README/README.html`;
		fullDescEle.textContent = `Full description`;
		fullDescEle.target = "_blank";
		fullDescEle.classList.add("bt");
		ele.append(fullDescEle);
		ele.append(document.createElement("br"));
		if (e[1].link) {
			Object.entries(e[1].link).forEach(([site, href]) => {
				const linkEle = document.createElement("a");
				linkEle.href = href;
				linkEle.textContent = `View on ${site}`;
				linkEle.target = "_blank";
				linkEle.classList.add("bt");
				ele.append(linkEle);
				ele.append(document.createElement("br"))
			})
		}
		if (e[1].version) {
			const versionEle = document.createElement("a");
			versionEle.href = `/extensions/${path}/data/dist/${e[0]}.${ext}`;
			versionEle.textContent = `Download (version ${e[1].version})`;
			versionEle.download = "";
			versionEle.classList.add("bt");
			ele.append(versionEle)
		}
		if (e[1].versions?.length) {
			const versionsEle = document.createElement("ul");
			const downloadLi = document.createElement("li");
			const downloadText = document.createElement("span");
			downloadText.textContent = `Download:`;
			downloadLi.append(downloadText);
			versionsEle.append(downloadLi);
			const rev = e[1].versions.toReversed();
			rev.forEach(version => {
				const versionLi = document.createElement("li");
				const versionEle = document.createElement("a");
				versionEle.href = `/extensions/${path}/data/dist/${e[0]}-${version}.${ext}`;
				versionEle.textContent = `Version ${version}`;
				versionEle.download = "";
				versionEle.classList.add("bt");
				versionLi.append(versionEle);
				versionsEle.append(versionLi)
			});
			versionsEle.children[5]?.insertAdjacentHTML("beforebegin", '<li class="lisum"><details><summary>Historical versions</summary></details></li>');
			ele.append(versionsEle)
		}
		linksEle.append(ele)
	});
	return linksEle.innerHTML
}
module.exports = createLinks;
