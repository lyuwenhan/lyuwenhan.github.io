(() => {
	const nav = document.querySelector("nav");
	if (!nav) {
		return
	}
	if (!nav.classList.contains("full-nav")) {
		fetch("/nav.html").then(async res => {
			if (res.ok) {
				nav.outerHTML = await res.text()
			}
		})
	}
})();
