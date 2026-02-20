const linksEle = document.getElementById("links");
fetch("/extensions/minecraft-bedrock/data/versions.json", {
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
		img.src = `/extensions/minecraft-bedrock/data/assets/${e[0]}/icon.png`;
		ele.append(img);
		ele.append(document.createElement("br"))
	}
	const aEle = document.createElement("a");
	aEle.href = `/extensions/minecraft-bedrock/data/dist/${e[0]}.mcpack`;
	if (e[1].version) {
		aEle.innerText = `Download (version ${e[1].version})`
	} else {
		aEle.innerText = `Download`
	}
	aEle.download = "";
	aEle.classList.add("bt");
	ele.append(aEle);
	linksEle.append(ele)
}));
