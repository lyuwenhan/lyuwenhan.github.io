const totopEle = document.getElementById("to-top");
window.addEventListener("scroll", () => {
	totopEle.hidden = window.scrollY === 0
});
totopEle.hidden = window.scrollY === 0;
