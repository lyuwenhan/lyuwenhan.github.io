function between(a) {
	return 1 <= a && a <= 9
}
let grid = Array.from({
	length: 9
}, () => Array.from({
	length: 9
}, () => ({
	type: "guess",
	value: Array(9).fill(true)
})));
let prevI = -1;
const prev = [];
let boxes = grid.map((row, i) => row.map((_, j) => document.getElementById(`box${i+1}-${j+1}`)));
let focus = null;

function removeGuess() {
	let hasChange;
	do {
		hasChange = false;
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.type === "guess") {
				const filt = boxValue.value.map((value, i) => ({
					value,
					i
				})).filter(({
					value
				}) => value).map(({
					i
				}) => i + 1);
				if (filt.length === 1) {
					boxValue.type = "number";
					boxValue.value = filt[0];
					hasChange = true
				}
			}
			if (boxValue.type !== "guess") {
				const positions = new Set;
				for (let y = 0; y < 9; y++) {
					if (y !== j) {
						positions.add(`${i},${y}`)
					}
				}
				for (let x = 0; x < 9; x++) {
					if (x !== i) {
						positions.add(`${x},${j}`)
					}
				}
				const blockRow = Math.floor(i / 3) * 3;
				const blockCol = Math.floor(j / 3) * 3;
				for (let x = blockRow; x < blockRow + 3; x++) {
					for (let y = blockCol; y < blockCol + 3; y++) {
						if (x === i && y === j) {
							continue
						}
						positions.add(`${x},${y}`)
					}
				}
				Array.from(positions).map(s => s.split(",").map(Number)).forEach(([x, y]) => {
					if (grid[x][y].type === "guess" && grid[x][y].value[boxValue.value - 1]) {
						hasChange = true;
						grid[x][y].value[boxValue.value - 1] = false
					}
				})
			}
		}))
	} while (hasChange)
}

function addGuess(i, j) {
	console.log(i - 1, j - 1);
	let boxValue = grid[i - 1][j - 1];
	if (boxValue.type === "guess") {
		return
	}
	const positions = new Set;
	for (let y = 0; y < 9; y++) {
		if (y !== j - 1) {
			positions.add(`${i-1},${y}`)
		}
	}
	for (let x = 0; x < 9; x++) {
		if (x !== i - 1) {
			positions.add(`${x},${j-1}`)
		}
	}
	const blockRow = Math.floor((i - 1) / 3) * 3;
	const blockCol = Math.floor((j - 1) / 3) * 3;
	for (let x = blockRow; x < blockRow + 3; x++) {
		for (let y = blockCol; y < blockCol + 3; y++) {
			if (x === i - 1 && y === j - 1) {
				continue
			}
			positions.add(`${x},${y}`)
		}
	}
	Array.from(positions).map(s => s.split(",").map(Number)).forEach(([x, y]) => {
		console.log(x, y);
		if (grid[x][y].type === "guess") {
			grid[x][y].value[boxValue.value - 1] = true
		}
	});
	grid[i - 1][j - 1] = {
		type: "guess",
		value: Array(9).fill(true)
	}
}

function display() {
	boxes.forEach((row, i) => row.forEach((box, j) => {
		const boxValue = grid[i][j];
		box.innerHTML = "";
		if (boxValue.type === "guess") {
			boxValue.value.forEach((isTrue, number) => {
				if (!isTrue) {
					return false
				}
				const numberEle = document.createElement("span");
				numberEle.classList.add("box-guess");
				numberEle.classList.add(`box-guess-${number+1}`);
				numberEle.innerText = number + 1;
				box.append(numberEle)
			})
		} else {
			const numberEle = document.createElement("span");
			numberEle.classList.add("box-value");
			numberEle.classList.add(`box-value-${boxValue.value}`);
			numberEle.innerText = boxValue.value;
			box.append(numberEle)
		}
	}))
}
display();

function setHistory() {
	prev.length = prevI + 1;
	prev.push(JSON.stringify(grid));
	prevI = prev.length - 1;
	if (prev.length > 300) {
		prev.shift()
	}
}
setHistory();

function removeFocus() {
	document.querySelectorAll(".box.box-focus").forEach(e => e.classList.remove("box-focus"))
}

function setFocus() {
	boxes[focus.x - 1]?.[focus.y - 1]?.classList?.add("box-focus")
}
document.addEventListener("click", e => {
	removeFocus();
	focus = null;
	const td = e.target.closest("td.box");
	if (td) {
		const match = td.id.match(/^box(\d+)[-_](\d+)$/);
		if (match) {
			const x = Number(match[1]);
			const y = Number(match[2]);
			focus = {
				x,
				y
			};
			setFocus()
		}
	}
});
document.addEventListener("keydown", e => {
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
		e.preventDefault();
		if (!prev.length) {
			return
		}
		if (e.shiftKey) {
			if (prevI < prev.length - 1) {
				prevI++;
				grid = JSON.parse(prev[prevI]);
				display()
			}
		} else {
			if (prevI > 0) {
				prevI--;
				grid = JSON.parse(prev[prevI]);
				display()
			}
		}
	} else if (e.key.startsWith("Arrow")) {
		e.preventDefault();
		if (e.key === "ArrowUp") {
			if (focus.x <= 1) {
				return
			}
			focus.x--
		} else if (e.key === "ArrowDown") {
			if (focus.x >= 9) {
				return
			}
			focus.x++
		} else if (e.key === "ArrowLeft") {
			if (focus.y <= 1) {
				return
			}
			focus.y--
		} else {
			if (focus.y >= 9) {
				return
			}
			focus.y++
		}
		removeFocus();
		setFocus()
	} else if (!e.repeat && focus && between(focus.x) && between(focus.y)) {
		if (/^[1-9]$/.test(e.key)) {
			if (grid[focus.x - 1][focus.y - 1].type !== "guess") {
				addGuess(focus.x, focus.y)
			}
			grid[focus.x - 1][focus.y - 1] = {
				type: "number",
				value: Number(e.key)
			};
			removeGuess();
			setHistory();
			display()
		} else if (e.key === "Backspace" || e.key === "Delete") {
			if (grid[focus.x - 1][focus.y - 1].type !== "guess") {
				addGuess(focus.x, focus.y)
			}
			grid[focus.x - 1][focus.y - 1] = {
				type: "guess",
				value: Array(9).fill(true)
			};
			removeGuess();
			setHistory();
			display()
		}
	}
});
