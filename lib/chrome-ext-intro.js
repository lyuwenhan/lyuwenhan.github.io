const linksEle = document.getElementById("links");
fetch("/chrome-extensions/versions.json", {
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
	if(e[1].description){
		const a = document.createElement("a");
		a.innerText = e[1].description;
		ele.append(a);
		ele.append(document.createElement("br"));
	}
	const img = document.createElement("img");
	img.classList.add("imgPreview");
	img.src = `/chrome-extensions/${e[0]}/icons/icon128.png`;
	ele.append(img);
	const version = e[1].version;
	const aEle = document.createElement("a");
	aEle.href = e[1].href;
	aEle.innerText = `Version ${version}`;
	aEle.target = "_blank";
	aEle.classList.add("bt");
	ele.append(document.createElement("br"));
	ele.append(aEle);
	linksEle.append(ele)
}));
