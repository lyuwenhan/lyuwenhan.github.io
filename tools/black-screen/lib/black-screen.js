const mainEle = document.querySelector(".main");
const screenEle = document.getElementById("screen");
mainEle.addEventListener("click", e => {
	e.preventDefault();
	e.stopPropagation();
	screenEle.requestFullscreen()
}, true);
document.addEventListener("fullscreenchange", () => {
	if (document.fullscreenElement) {
		document.body.classList.add("hide-cursor");
		document.body.requestPointerLock()
	} else {
		document.body.classList.remove("hide-cursor");
		document.exitPointerLock()
	}
}, true);
