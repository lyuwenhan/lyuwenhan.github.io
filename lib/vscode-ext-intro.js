const linksEle = document.getElementById("links");
fetch("/vscode-extensions/versions.json", {
	cache: "reload"
}).then(response => response.json()).then(versions => Object.entries(versions).filter(e => e[0] && e[1]?.versions?.length).forEach(e => {
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
	img.src = `/vscode-extensions/${e[0]}/media/icon.png`;
	ele.append(img);
	ele.append(document.createElement("br"));
	const descEle = document.createElement("a");
	descEle.href = `/vscode-extensions/${e[0]}`;
	descEle.innerText = `Full description`;
	descEle.target = "_blank";
	descEle.classList.add("bt");
	ele.append(descEle);
	const ele3 = document.createElement("ul");
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
		aEle.href = `/vscode-extensions/extensions/${e[0]}-${version}.vsix`;
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
	ele.append(ele3);
	linksEle.append(ele)
}));
