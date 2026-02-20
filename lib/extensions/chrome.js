const linksEle = document.getElementById("links");
fetch("/extensions/chrome/data/versions.json", {
	cache: "reload"
}).then(response => response.json()).then(e => Object.entries(e)).then(versions => versions.filter(e => e[0]).forEach(e => {
	const ele = document.createElement("details");
	ele.id = "links-" + e[0];
	ele.classList.add("linksEle");
	const ele1 = document.createElement("summary");
	const ele2 = document.createElement("h3");
	ele2.innerText = e[1].displayName ?? e[0];
	ele2.classList.add("extension-name");
	ele1.append(ele2);
	ele.append(ele1);
	if (e[1].description) {
		const a = document.createElement("a");
		a.innerText = e[1].description;
		ele.append(a);
		ele.append(document.createElement("br"))
	}
	if (e[1].hasIcon) {
		const img = document.createElement("img");
		img.classList.add("imgPreview");
		img.src = `/extensions/chrome/data/assets/${e[0]}/icon.png`;
		ele.append(img);
		ele.append(document.createElement("br"))
	}
	const descEle = document.createElement("a");
	descEle.href = `/extensions/chrome/data/assets/${e[0]}`;
	descEle.innerText = `Full description`;
	descEle.target = "_blank";
	descEle.classList.add("bt");
	ele.append(descEle);
	ele.append(document.createElement("br"));
	const version = e[1].version;
	if (e[1].href) {
		const aEle = document.createElement("a");
		aEle.href = e[1].href;
		aEle.innerText = `Download From Chrome web store (version ${version})`;
		aEle.target = "_blank";
		aEle.classList.add("bt");
		ele.append(aEle);
		ele.append(document.createElement("br"))
	}
	const a2Ele = document.createElement("a");
	a2Ele.href = `/extensions/chrome/data/dist/${e[0]}/${e[0]}.zip`;
	a2Ele.innerText = `Download ZIP`;
	a2Ele.download = "";
	a2Ele.classList.add("bt");
	ele.append(a2Ele);
	if (versions.length <= 5) {
		ele.open = true
	}
	linksEle.append(ele)
}));
