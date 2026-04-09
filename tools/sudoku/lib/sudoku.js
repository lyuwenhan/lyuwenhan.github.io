const buttonReset = document.getElementById("button-reset");
const buttonSolve = document.getElementById("button-solve");
const buttonResetNotes = document.getElementById("button-reset-notes");

function between(a) {
	return 1 <= a && a <= 9
}
let grid;

function resetGrid() {
	grid = Array.from({
		length: 9
	}, () => Array.from({
		length: 9
	}, () => ({
		type: "guess",
		value: Array(9).fill(true)
	})))
}
resetGrid();
let prevI = -1;
const prev = [];
let boxes = grid.map((row, i) => row.map((_, j) => document.getElementById(`box${i+1}-${j+1}`)));
let focus = null;

function removeGuess1(needUpdate) {
	needUpdate = needUpdate ? new Set(needUpdate) : new Set(Array.from({
		length: 9
	}, (_, i) => Array.from({
		length: 9
	}, (_, j) => `${i},${j}`)).flat());
	while (needUpdate.size > 0) {
		const update = needUpdate.values().next().value;
		needUpdate.delete(update);
		const [i, j] = update.split(",").map(Number);
		const boxValue = grid[i][j];
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
				boxValue.value = filt[0]
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
					grid[x][y].value[boxValue.value - 1] = false;
					needUpdate.add(`${x},${y}`)
				}
			})
		}
	}
}

function removeGuess2() {
	removeGuess1();
	const needUpdate = [];
	do {
		needUpdate.length = 0;
		const rows = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => ({
			count: 0,
			position: null
		})));
		const cols = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => ({
			count: 0,
			position: null
		})));
		const blocks = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => ({
			count: 0,
			position: null
		})));
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.type === "guess") {
				const blockNumber = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				boxValue.value.forEach((isTrue, value) => {
					if (!isTrue) {
						return
					}
					rows[i][value].count++;
					rows[i][value].position = [i, j];
					cols[j][value].count++;
					cols[j][value].position = [i, j];
					blocks[blockNumber][value].count++;
					blocks[blockNumber][value].position = [i, j]
				})
			}
		}));
		rows.forEach(row => row.forEach((rowValue, value) => {
			if (rowValue.count === 1) {
				grid[rowValue.position[0]][rowValue.position[1]].type = "number";
				grid[rowValue.position[0]][rowValue.position[1]].value = value + 1;
				needUpdate.push(`${rowValue.position[0]},${rowValue.position[1]}`)
			}
		}));
		cols.forEach(col => col.forEach((colValue, value) => {
			if (colValue.count === 1) {
				grid[colValue.position[0]][colValue.position[1]].type = "number";
				grid[colValue.position[0]][colValue.position[1]].value = value + 1;
				needUpdate.push(`${colValue.position[0]},${colValue.position[1]}`)
			}
		}));
		blocks.forEach(block => block.forEach((blockValue, value) => {
			if (blockValue.count === 1) {
				grid[blockValue.position[0]][blockValue.position[1]].type = "number";
				grid[blockValue.position[0]][blockValue.position[1]].value = value + 1;
				needUpdate.push(`${blockValue.position[0]},${blockValue.position[1]}`)
			}
		}));
		if (needUpdate.length > 0) {
			removeGuess1(needUpdate)
		}
	} while (needUpdate.length > 0)
}

function removeGuess() {
	removeGuess2()
}

function addGuess(i, j) {
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
		if (grid[x][y].type === "guess") {
			grid[x][y].value[boxValue.value - 1] = true
		}
	});
	grid[i - 1][j - 1] = {
		type: "guess",
		value: Array(9).fill(true)
	}
}

function resetNotes() {
	grid.forEach((row, i) => row.forEach((boxValue, j) => {
		if (boxValue.type === "guess") {
			boxValue.value = Array(9).fill(true)
		}
	}));
	removeGuess()
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
buttonReset.addEventListener("click", () => {
	resetGrid();
	setHistory();
	display()
});
buttonSolve.addEventListener("click", () => {
	removeGuess()
});
buttonResetNotes.addEventListener("click", () => {
	resetNotes();
	setHistory();
	display()
});
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
