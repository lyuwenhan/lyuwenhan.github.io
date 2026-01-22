const drop = document.getElementById("drop");
const fileInput = document.getElementById("file");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgColorInput = document.getElementById("bgColor");
const btnDownload = document.getElementById("download");
const setW = document.getElementById("setW");
const setH = document.getElementById("setH");
const btnCopy = document.getElementById("copy");
const removeTrans = document.getElementById("removeTrans");
const noSmooth = document.getElementById("noSmooth");
const dragOverlay = document.getElementById("dragOverlay");
const canvasDisplay = document.getElementById("canvasDisplay");
const loadByUrl = document.getElementById("loadByUrl");
const prev = document.getElementById("prev");
let currentImage = null;
let imgWidth = 1,
	imgHeight = 1;
let realWidth = 1,
	realHeight = 1;
const defaultSetting = {
	remTrans: false,
	useSmooth: true,
	remColor: "#ffffff"
};
let userSetting = {};
try {
	userSetting = {
		...defaultSetting,
		...JSON.parse(window.localStorage.getItem("image-editor-setting"))
	}
} catch {
	userSetting = defaultSetting
}
window.localStorage.setItem("image-editor-setting", JSON.stringify(userSetting));
removeTrans.checked = userSetting.remTrans;
noSmooth.checked = !userSetting.useSmooth;
bgColorInput.value = userSetting.remColor;

function loadImageFromFile(file) {
	return new Promise((resolve, reject) => {
		const img = new Image;
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = URL.createObjectURL(file)
	})
}
async function handleFile(file) {
	if (!file || !file.type.startsWith("image/")) return;
	try {
		currentImage = await loadImageFromFile(file);
		setW.value = realWidth = imgWidth = currentImage.naturalWidth;
		setH.value = realHeight = imgHeight = currentImage.naturalHeight;
		render();
		prev.hidden = false;
		btnDownload.disabled = false;
		btnCopy.disabled = false;
		drop.innerText = "Loaded: " + file.name + "\nDrag image, click, or paste to upload new one"
	} catch {
		alert("Failed to load image.")
	}
}

function loadImageFromUrlCors(url) {
	return new Promise((resolve, reject) => {
		const img = new Image;
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = "https://wsrv.nl/?url=" + encodeURIComponent(url)
	})
}

function canUseInCanvas(img) {
	const c = document.createElement("canvas");
	c.width = c.height = 1;
	const ctx = c.getContext("2d");
	try {
		ctx.drawImage(img, 0, 0, 1, 1);
		ctx.getImageData(0, 0, 1, 1);
		return true
	} catch {
		return false
	}
}

function loadImageFromUrl(url) {
	return new Promise((resolve, reject) => {
		if (url.startsWith("data:")) {
			const img = new Image;
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
			return
		}
		let u;
		try {
			u = new URL(url)
		} catch {
			reject(new Error("Invalid URL"));
			return
		}
		if (u.protocol !== "http:" && u.protocol !== "https:") {
			reject(new Error("Unsupported protocol"));
			return
		}
		const img = new Image;
		img.crossOrigin = "anonymous";
		img.onload = () => {
			if (canUseInCanvas(img)) {
				resolve(img)
			} else {
				img.onerror()
			}
		};
		img.onerror = () => {
			loadImageFromUrlCors(url).then(resolve).catch(reject)
		};
		img.src = url
	})
}
async function handleUrl(url) {
	url = url?.trim();
	if (!url) return;
	try {
		currentImage = await loadImageFromUrl(url);
		setW.value = realWidth = imgWidth = currentImage.naturalWidth;
		setH.value = realHeight = imgHeight = currentImage.naturalHeight;
		render();
		prev.hidden = false;
		btnDownload.disabled = false;
		btnCopy.disabled = false;
		drop.innerText = "Loaded: Image by url\nDrag image, click, or paste to upload new one"
	} catch {
		alert("Failed to load image.")
	}
}

function render() {
	if (!currentImage) return;
	canvas.width = imgWidth;
	canvas.height = imgHeight;
	ctx.imageSmoothingEnabled = userSetting.useSmooth;
	if (userSetting.remTrans) {
		ctx.fillStyle = userSetting.remColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	}
	ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
	canvasDisplay.src = canvas.toDataURL("image/png")
}
setH.addEventListener("input", () => {
	if (!setH.value) {
		return
	}
	imgHeight = Math.max(1, Number(setH.value) || 1);
	imgWidth = Math.max(1, Math.round(realWidth * imgHeight / realHeight));
	setH.value = imgHeight;
	setW.value = imgWidth;
	render()
});
setW.addEventListener("input", () => {
	if (!setW.value) {
		return
	}
	imgWidth = Math.max(1, Number(setW.value) || 1);
	imgHeight = Math.max(1, Math.round(realHeight * imgWidth / realWidth));
	setH.value = imgHeight;
	setW.value = imgWidth;
	render()
});
removeTrans.addEventListener("input", () => {
	userSetting.remTrans = removeTrans.checked;
	window.localStorage.setItem("image-editor-setting", JSON.stringify(userSetting));
	render()
});
noSmooth.addEventListener("input", () => {
	userSetting.useSmooth = !noSmooth.checked;
	window.localStorage.setItem("image-editor-setting", JSON.stringify(userSetting));
	render()
});
bgColorInput.addEventListener("input", () => {
	userSetting.remColor = bgColorInput.value;
	window.localStorage.setItem("image-editor-setting", JSON.stringify(userSetting));
	render()
});
document.addEventListener("dragover", e => {
	e.preventDefault();
	drop.classList.add("dragover")
});
dragOverlay.addEventListener("dragleave", () => {
	drop.classList.remove("dragover")
});
loadByUrl.addEventListener("keydown", e => {
	if (e.key === "Enter") {
		handleUrl(loadByUrl.value);
		loadByUrl.value = ""
	}
});
document.addEventListener("drop", e => {
	e.preventDefault();
	drop.classList.remove("dragover");
	const file = e.dataTransfer.files[0];
	handleFile(file)
});
drop.addEventListener("click", () => {
	fileInput.click()
});
fileInput.addEventListener("change", e => {
	const file = e.target.files[0];
	handleFile(file);
	fileInput.value = ""
});
document.addEventListener("paste", e => {
	const items = e.clipboardData?.items;
	if (!items) return;
	for (const item of items) {
		if (item.type.startsWith("image/")) {
			const file = item.getAsFile();
			if (file) {
				handleFile(file);
				e.preventDefault();
				break
			}
		}
	}
});
btnDownload.addEventListener("click", () => {
	const a = document.createElement("a");
	a.href = canvas.toDataURL("image/png");
	a.download = "output.png";
	a.click()
});
let copto;
btnCopy.addEventListener("click", async () => {
	canvas.toBlob(async blob => {
		try {
			await navigator.clipboard.write([new ClipboardItem({
				"image/png": blob
			})]);
			if (copto) {
				clearTimeout(copto)
			}
			copto = setTimeout(() => {
				btnCopy.innerText = "Copy"
			}, 2e3);
			btnCopy.innerText = "Copied"
		} catch {
			alert("Copy failed")
		}
	}, "image/png")
});
