const testTime = document.getElementById("testTime");
const testArea = document.getElementById("testArea");
const testText = document.getElementById("testText");
const cps = document.getElementById("cps");
const restartBt = document.getElementById("restart");
const timeline = document.getElementById("timeline");
let time = Math.max(1, Number(localStorage.getItem("cps-time")) || 5);
let startTime;
let timeWent = 0;
let left = 0;
let started = false;
let endTo = null,
	endInt = null;
let clicked = 0;
let clickedAtEnd = 0;

function to2(i) {
	return Math.round(i * 10) / 10
}

function restart() {
	started = false;
	testTime.value = time;
	left = 0;
	timeWent = 0;
	clicked = 0;
	testText.innerText = "Press space bar to start testing";
	cps.innerText = ``;
	timeline.innerHTML = "";
	if (endTo) {
		clearTimeout(endTo);
		endTo = null
	}
	if (endInt) {
		clearInterval(endInt);
		endInt = null
	}
}
testTime.addEventListener("input", () => {
	if (!testTime.value) {
		return
	}
	time = Math.max(1, Number(testTime.value) || 1);
	localStorage.setItem("cps-time", time);
	restart()
});
restart();
restartBt.addEventListener("click", () => {
	restart()
});
window.addEventListener("keydown", e => {
	if (e.code !== "Space" || e.repeat) {
		return
	}
	e.preventDefault();
	if (left > 0) {
		timeWent = (performance.now() - startTime) / 1e3;
		left = time - timeWent
	}
	if (started) {
		clicked++
	} else {
		started = true;
		left = time;
		timeWent = 0;
		cps.innerText = ``;
		startTime = performance.now();
		endTo = setTimeout(() => {
			clickedAtEnd = clicked;
			if (endInt) {
				clearInterval(endInt)
			}
			clicked = 0;
			left = 0;
			testText.innerText = `Test finished`;
			cps.innerText = `Your CPS: ${to2(clickedAtEnd/time)}`
		}, time * 1e3);
		endInt = setInterval(() => {
			timeWent = (performance.now() - startTime) / 1e3;
			left = time - timeWent;
			testText.innerText = `${to2(left)} seconds left`;
			if (clicked >= 1) {
				cps.innerText = `Current CPS: ${to2(clicked/timeWent)}`
			}
		}, 100)
	}
	if (left > 0) {
		const rect = testArea.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const timedot = document.createElement("div");
		timedot.classList.add("timedot");
		timedot.style.setProperty("--place", timeWent / time);
		timeline.append(timedot)
	}
});
testArea.addEventListener("contextmenu", e => {
	e.preventDefault()
});
