(async () => {
	const nav = document.getElementById("nav");
	if (!nav) {
		return
	}
	if (!nav.querySelector(".full-nav")) {
		fetch("/nav.html").then(async res => {
			if (res.ok) {
				nav.innerHTML = await res.text()
			}
		})
	}
})();
const totopEle = document.getElementById("to-top");
window.addEventListener("scroll", () => {
	totopEle.hidden = window.scrollY === 0
});
totopEle.hidden = window.scrollY === 0;
