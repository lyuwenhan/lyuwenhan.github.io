const main = document.querySelector(".main");
main.addEventListener("click", e => {
	e.preventDefault();
	e.stopPropagation();
	main.requestFullscreen()
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
