const linksEle = document.getElementById("links");
fetch("/extensions/minecraft-java/data/versions.json", {
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
		img.src = `/extensions/minecraft-java/data/assets/${e[0]}/icon.png`;
		ele.append(img);
		ele.append(document.createElement("br"))
	}
	const descEle = document.createElement("a");
	descEle.href = `/extensions/minecraft-java/data/assets/${e[0]}/README/README.html`;
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
	if (e[1].versions?.length) {
		const ele3 = document.createElement("ul");
		const txtLiEle = document.createElement("li");
		const txtEle = document.createElement("a");
		txtEle.innerText = `Download:`;
		txtLiEle.append(txtEle);
		ele3.append(txtLiEle);
		const rev = e[1].versions.toReversed();
		let verI = 5;
		let lVer = undefined;
		for (let i = 0; i < 7 && i < rev.length; i++) {
			const ver = rev[i].split(".");
			if (lVer !== undefined && (ver[0] !== lVer[0] || ver[1] !== lVer[1])) {
				verI = i;
				break
			}
			lVer = ver
		}
		rev.forEach((version, i) => {
			const liEle = document.createElement("li");
			const aEle = document.createElement("a");
			aEle.href = `/extensions/minecraft-java/data/dist/${e[0]}-${version}.jar`;
			aEle.innerText = `Version ${version}`;
			aEle.download = "";
			aEle.classList.add("bt");
			liEle.append(aEle);
			ele3.append(liEle)
		});
		const child = ele3.children[verI];
		if (child) {
			child.insertAdjacentHTML("beforebegin", '<li class="lisum"><details><summary>Historical versions</summary></details></li>')
		}
		ele.append(ele3)
	}
	linksEle.append(ele)
}));
