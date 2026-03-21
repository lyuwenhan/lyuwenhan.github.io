const linksEle = document.getElementById("links");
fetch("/extensions/chrome/data/versions.json", {
	cache: "reload"
}).then(response => response.json()).then(e => Object.entries(e).filter(e => e[0]).forEach(e => {
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
	descEle.href = `/extensions/chrome/data/assets/${e[0]}/README/README.html`;
	descEle.innerText = `Full description`;
	descEle.target = "_blank";
	descEle.classList.add("bt");
	ele.append(descEle);
	ele.append(document.createElement("br"));
	Object.entries(e[1].link).forEach(([site, href]) => {
		const linkEle = document.createElement("a");
		linkEle.href = href;
		linkEle.innerText = `View on ${site}`;
		linkEle.target = "_blank";
		linkEle.classList.add("bt");
		ele.append(linkEle);
		ele.append(document.createElement("br"))
	});
	if(e[1].version){
		const aEle = document.createElement("a");
		aEle.href = `/extensions/chrome/data/dist/${e[0]}.zip`;
		aEle.innerText = `Download (version ${e[1].version})`;
		aEle.download = "";
		aEle.classList.add("bt");
		ele.append(aEle);
	}
	linksEle.append(ele)
}));
