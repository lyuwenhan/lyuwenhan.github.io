const testTime = document.getElementById("testTime");
const testArea = document.getElementById("testArea");
const testText = document.getElementById("testText");
const testDisplay = document.getElementById("testDisplay");
const cps = document.getElementById("cps");
const restartBt = document.getElementById("restart");
let time = 5;
let left = 0;
let started = false;
let endTo = null,
	endInt = null;
let clicked = 0;
let clickedAtEnd = 0;
const ctx = testDisplay.getContext("2d");

function resizeCanvas() {
	const rect = testArea.getBoundingClientRect();
	if (testDisplay.width == rect.width && testDisplay.height == rect.height) {
		return
	}
	const backup = document.createElement("canvas");
	backup.width = testDisplay.width;
	backup.height = testDisplay.height;
	backup.getContext("2d").drawImage(testDisplay, 0, 0);
	testDisplay.width = rect.width;
	testDisplay.height = rect.height;
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(backup, 0, 0)
}

function clearCanvas() {
	ctx.clearRect(0, 0, testDisplay.width, testDisplay.height)
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawDot(x, y) {
	ctx.fillStyle = "#00c853";
	ctx.fillRect(Math.floor(x) - 3, Math.floor(y) - 3, 5, 5);
}

function to2(i) {
	return Math.round(i * 10) / 10
}

function restart() {
	started = false;
	testTime.value = time;
	left = 0;
	clicked = 0;
	testText.innerText = "Click to start testing";
	cps.innerText = ``;
	if (endTo) {
		clearTimeout(endTo);
		endTo = null
	}
	if (endInt) {
		clearInterval(endInt);
		endInt = null
	}
	restartBt.hidden = true;
	clearCanvas();
	ctx.imageSmoothingEnabled = false
}
testTime.addEventListener("input", () => {
	if (!testTime.value) {
		return
	}
	time = Math.max(1, Number(testTime.value) || 1);
	restart()
});
restart();
restartBt.addEventListener("click", () => {
	restart()
});
testArea.addEventListener("pointerdown", e => {
	if (started) {
		clicked++
	} else {
		restartBt.hidden = true;
		started = true;
		left = time;
		cps.innerText = ``;
		endTo = setTimeout(() => {
			clickedAtEnd = clicked;
			if (endInt) {
				clearInterval(endInt)
			}
			clicked = 0;
			left = 0;
			testText.innerText = `Test finished`;
			cps.innerText = `Your CPS: ${to2((clickedAtEnd-1)/time)}`;
			restartBt.hidden = false
		}, time * 1e3);
		endInt = setInterval(() => {
			left -= .1;
			testText.innerText = `${to2(left)} seconds left`;
			if (clicked >= 1) {
				cps.innerText = `Current CPS: ${to2(clicked/(time-left))}`
			}
		}, 100)
	}
	if (left > 0) {
		const rect = testArea.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		drawDot(x, y)
	}
});
