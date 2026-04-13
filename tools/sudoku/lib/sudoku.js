const buttonReset = document.getElementById("button-reset");
const buttonSolve = document.getElementById("button-solve");
const buttonResetNotes = document.getElementById("button-reset-notes");
const autoSolveNakedSingleEle = document.getElementById("auto-solve-naked-single");
const autoSolveNakedSubsetEle = document.getElementById("auto-solve-naked-subset");
const autoSolveHiddenSingleEle = document.getElementById("auto-solve-hidden-single");
const autoSolvePointingNumbersEle = document.getElementById("auto-solve-pointing-numbers");
const multipleAnswerCheckEle = document.getElementById("multiple-answer-check");
let autoSolveNakedSingle = window.localStorage.getItem("sudoku-solver-auto-solve-naked-single") !== "false";
autoSolveNakedSingleEle.checked = autoSolveNakedSingle;
let autoSolveNakedSubset = window.localStorage.getItem("sudoku-solver-auto-solve-naked-subset") !== "false";
autoSolveNakedSubsetEle.checked = autoSolveNakedSubset;
let autoSolveHiddenSingle = window.localStorage.getItem("sudoku-solver-auto-solve-hidden-single") !== "false";
autoSolveHiddenSingleEle.checked = autoSolveHiddenSingle;
let autoSolvePointingNumbers = window.localStorage.getItem("sudoku-solver-auto-solve-pointing-numbers") !== "false";
autoSolvePointingNumbersEle.checked = autoSolvePointingNumbers;
let multipleAnswerCheck = window.localStorage.getItem("sudoku-solver-multiple-answer-check") !== "false";
multipleAnswerCheckEle.checked = multipleAnswerCheck;

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
const focus = new Set;

function boolToNumber(arr) {
	return arr.map((value, i) => ({
		value,
		i
	})).filter(({
		value
	}) => value).map(({
		i
	}) => i + 1)
}

function getPositions(i, j) {
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
	positions.delete(`${i-1},${j-1}`);
	return Array.from(positions).map(s => s.split(",").map(Number))
}

function removeGuess(needUpdate) {
	let updated = false;
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
			continue
		}
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
				updated = true;
				grid[x][y].value[boxValue.value - 1] = false;
				needUpdate.add(`${x},${y}`)
			}
		})
	}
	return updated
}

function solveNakedSingleAndSubset() {
	const solveSingle = autoSolveNakedSingle;
	const solveSubset = autoSolveNakedSubset;
	let updated = false;
	const needUpdate = [];
	do {
		needUpdate.length = 0;
		const nakedSingle = [];
		const rows = Array.from({
			length: 9
		}, () => ({}));
		const cols = Array.from({
			length: 9
		}, () => ({}));
		const blocks = Array.from({
			length: 9
		}, () => ({}));
		const toNumbered = grid.map(row => row.map(box => box.type === "guess" ? boolToNumber(box.value) : []));
		const toNumberedStr = toNumbered.map(row => row.map(box => box.join(" ")));
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.type !== "guess") {
				return
			}
			const filt = toNumbered[i][j];
			if (solveSingle && filt.length === 1) {
				nakedSingle.push([i, j, filt[0]]);
				updated = true;
				needUpdate.push(`${i},${j}`)
			} else if (solveSubset && filt.length <= 4) {
				const blockNumber = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				const numbers = filt.join(" ");
				if (!rows[i][numbers]) {
					rows[i][numbers] = []
				}
				rows[i][numbers].push([i, j]);
				if (!cols[j][numbers]) {
					cols[j][numbers] = []
				}
				cols[j][numbers].push([i, j]);
				if (!blocks[blockNumber][numbers]) {
					blocks[blockNumber][numbers] = []
				}
				blocks[blockNumber][numbers].push([i, j])
			}
		}));
		nakedSingle.forEach(([i, j, value]) => {
			const boxValue = grid[i][j];
			boxValue.type = "number";
			boxValue.value = value
		});
		rows.forEach((row, i) => {
			for (let guessStr in row) {
				let guess = guessStr.split(" ");
				const pos = row[guessStr];
				if (pos.length === guess.length) {
					grid[i].forEach((box, j) => {
						if (box.type === "guess") {
							if (toNumberedStr[i][j] !== guessStr) {
								console.log("row rem", i, j, guessStr);
								let upd = false;
								guess.forEach(value => {
									if (box.value[value - 1]) {
										upd = true;
										box.value[value - 1] = false
									}
								});
								if (upd) {
									updated = true;
									needUpdate.push(`${i},${j}`)
								}
							}
						}
					})
				}
			}
		});
		cols.forEach((col, j) => {
			for (let guessStr in col) {
				let guess = guessStr.split(" ");
				const pos = col[guessStr];
				if (pos.length === guess.length) {
					grid.forEach((row, i) => {
						const box = row[j];
						if (box.type === "guess") {
							if (toNumberedStr[i][j] !== guessStr) {
								console.log("col rem", i, j, guessStr);
								let upd = false;
								guess.forEach(value => {
									if (box.value[value - 1]) {
										upd = true;
										box.value[value - 1] = false
									}
								});
								if (upd) {
									updated = true;
									needUpdate.push(`${i},${j}`)
								}
							}
						}
					})
				}
			}
		});
		blocks.forEach((block, k) => {
			for (let guessStr in block) {
				let guess = guessStr.split(" ");
				const pos = block[guessStr];
				if (pos.length === guess.length) {
					const blockRow = Math.floor(k / 3) * 3;
					const blockCol = k % 3 * 3;
					for (let i = blockRow; i < blockRow + 3; i++) {
						for (let j = blockCol; j < blockCol + 3; j++) {
							const box = grid[i][j];
							if (box.type === "guess") {
								if (toNumberedStr[i][j] !== guessStr) {
									console.log("blo rem", i, j, guessStr);
									let upd = false;
									guess.forEach(value => {
										if (box.value[value - 1]) {
											upd = true;
											box.value[value - 1] = false
										}
									});
									if (upd) {
										updated = true;
										needUpdate.push(`${i},${j}`)
									}
								}
							}
						}
					}
				}
			}
		});
		if (needUpdate.length) {
			removeGuess(needUpdate)
		}
	} while (needUpdate.length > 0);
	return updated
}

function solveHiddenSingle() {
	let updated = false;
	const needUpdate = [];
	do {
		needUpdate.length = 0;
		const rows = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => []));
		const cols = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => []));
		const blocks = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => []));
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.type === "guess") {
				const blockNumber = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				boxValue.value.forEach((isTrue, value) => {
					if (!isTrue) {
						return
					}
					rows[i][value].push([i, j]);
					cols[j][value].push([i, j]);
					blocks[blockNumber][value].push([i, j])
				})
			}
		}));
		rows.forEach(row => row.forEach((rowPositions, value) => {
			if (rowPositions.length === 1 && grid[rowPositions[0][0]][rowPositions[0][1]].type === "guess") {
				updated = true;
				grid[rowPositions[0][0]][rowPositions[0][1]].type = "number";
				grid[rowPositions[0][0]][rowPositions[0][1]].value = value + 1;
				needUpdate.push(`${rowPositions[0][0]},${rowPositions[0][1]}`)
			}
		}));
		cols.forEach(col => col.forEach((colPositions, value) => {
			if (colPositions.length === 1 && grid[colPositions[0][0]][colPositions[0][1]].type === "guess") {
				updated = true;
				grid[colPositions[0][0]][colPositions[0][1]].type = "number";
				grid[colPositions[0][0]][colPositions[0][1]].value = value + 1;
				needUpdate.push(`${colPositions[0][0]},${colPositions[0][1]}`)
			}
		}));
		blocks.forEach(block => block.forEach((blockPositions, value) => {
			if (blockPositions.length === 1 && grid[blockPositions[0][0]][blockPositions[0][1]].type === "guess") {
				updated = true;
				grid[blockPositions[0][0]][blockPositions[0][1]].type = "number";
				grid[blockPositions[0][0]][blockPositions[0][1]].value = value + 1;
				needUpdate.push(`${blockPositions[0][0]},${blockPositions[0][1]}`)
			}
		}));
		if (needUpdate.length > 0) {
			removeGuess(needUpdate)
		}
	} while (needUpdate.length > 0);
	return updated
}

function solvePointingNumbers() {
	let updated = false;
	let thisUpdated;
	do {
		thisUpdated = false;
		const rows = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => Array(3).fill(false)));
		const cols = Array.from({
			length: 9
		}, () => Array.from({
			length: 9
		}, () => Array(3).fill(false)));
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.type !== "guess") {
				return
			}
			const blockRow = Math.floor(i / 3) * 3;
			const blockCol = Math.floor(j / 3) * 3;
			const blockNumber = blockRow + blockCol / 3;
			boxValue.value.forEach((isTrue, number) => {
				if (!isTrue) {
					return
				}
				rows[blockNumber][number][i - blockRow] = true;
				cols[blockNumber][number][j - blockCol] = true
			})
		}));
		rows.forEach((block, k) => {
			block.forEach((valueBool, number) => {
				const innerRow = boolToNumber(valueBool);
				if (innerRow.length === 1) {
					const row = Math.floor(k / 3) * 3 + innerRow[0] - 1;
					for (let col = 0; col < 9; col++) {
						if (Math.floor(col / 3) === k % 3) {
							continue
						}
						if (grid[row][col].type === "guess" && grid[row][col].value[number]) {
							grid[row][col].value[number] = false;
							thisUpdated = updated = true
						}
					}
				}
			})
		});
		cols.forEach((block, k) => {
			block.forEach((valueBool, number) => {
				const innerCol = boolToNumber(valueBool);
				if (innerCol.length === 1) {
					const col = k % 3 * 3 + innerCol[0] - 1;
					for (let row = 0; row < 9; row++) {
						if (Math.floor(row / 3) === Math.floor(k / 3)) {
							continue
						}
						if (grid[row][col].type === "guess" && grid[row][col].value[number]) {
							grid[row][col].value[number] = false;
							thisUpdated = updated = true
						}
					}
				}
			})
		})
	} while (thisUpdated);
	return updated
}

function autoSolve() {
	removeGuess();
	let updated;
	do {
		updated = false;
		if (autoSolveNakedSingle || autoSolveNakedSubset) {
			updated = solveNakedSingleAndSubset() || updated
		}
		if (autoSolveHiddenSingle) {
			updated = solveHiddenSingle() || updated
		}
		if (autoSolvePointingNumbers) {
			updated = solvePointingNumbers() || updated
		}
	} while (updated)
}

function addGuess(i, j) {
	let boxValue = grid[i - 1][j - 1];
	if (boxValue.type === "guess") {
		return
	}
	getPositions(i, j).forEach(([x, y]) => {
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
	grid.forEach(row => row.forEach(boxValue => {
		if (boxValue.type === "guess") {
			boxValue.value = Array(9).fill(true)
		}
	}));
	autoSolve()
}

function display() {
	boxes.forEach((row, i) => row.forEach((box, j) => {
		const boxValue = grid[i][j];
		box.innerHTML = "";
		if (boxValue.type === "guess") {
			boxValue.value.forEach((isTrue, number) => {
				if (!isTrue) {
					return
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

function solve() {
	const triggerNumber = multipleAnswerCheck ? 2 : 1;
	const rows = Array.from({
		length: 9
	}, () => Array(9).fill(false));
	const cols = Array.from({
		length: 9
	}, () => Array(9).fill(false));
	const blocks = Array.from({
		length: 9
	}, () => Array(9).fill(false));
	const answer = [];

	function dfs(x, y) {
		if (x === 9) {
			answer.push(grid.map(row => row.map(boxValue => boxValue.value)));
			return
		}
		const nextY = (y + 1) % 9;
		const nextX = nextY === 0 ? x + 1 : x;
		if (grid[x][y].type === "number") {
			dfs(nextX, nextY);
			return
		}
		for (let i = 0; i < grid[x][y].value.length; i++) {
			if (answer.length >= triggerNumber) {
				return
			}
			if (!grid[x][y].value[i]) {
				continue
			}
			const blockNumber = Math.floor(x / 3) * 3 + Math.floor(y / 3);
			if (rows[x][i] || cols[y][i] || blocks[blockNumber][i]) {
				continue
			}
			rows[x][i] = true;
			cols[y][i] = true;
			blocks[blockNumber][i] = true;
			const boxValue = grid[x][y];
			grid[x][y] = {
				type: "number",
				value: i + 1
			};
			dfs(nextX, nextY);
			rows[x][i] = false;
			cols[y][i] = false;
			blocks[blockNumber][i] = false;
			grid[x][y] = boxValue
		}
	}
	for (let i = 0; i < grid.length; i++) {
		for (let j = 0; j < grid[i].length; j++) {
			const boxValue = grid[i][j];
			if (boxValue.type === "number") {
				const blockNumber = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				if (rows[i][boxValue.value - 1] || cols[j][boxValue.value - 1] || blocks[blockNumber][boxValue.value - 1]) {
					alert("Preset numbers conflict.");
					return
				}
				rows[i][boxValue.value - 1] = true;
				cols[j][boxValue.value - 1] = true;
				blocks[blockNumber][boxValue.value - 1] = true
			}
		}
	}
	dfs(0, 0);
	if (answer.length === 0) {
		alert("No solution.")
	} else if (answer.length === 1) {
		grid = answer[0].map(row => row.map(value => ({
			type: "number",
			value
		})));
		setHistory();
		display()
	} else {
		alert("Multiple solutions.")
	}
}

function setHistory() {
	prev.length = prevI + 1;
	const newHistory = JSON.stringify(grid);
	if (newHistory === prev.at(-1)) {
		return
	}
	prev.push(newHistory);
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
	for (const pos of focus) {
		const [x, y] = pos.split(",").map(Number);
		boxes[x - 1]?.[y - 1]?.classList?.add("box-focus")
	}
}

function posOk(x, y, num) {
	return getPositions(x, y).every(pos => grid[pos[0]][pos[1]].type !== "number" || grid[pos[0]][pos[1]].value !== num)
}
autoSolveNakedSingleEle.addEventListener("change", () => {
	autoSolveNakedSingle = autoSolveNakedSingleEle.checked;
	window.localStorage.setItem("sudoku-solver-auto-solve-naked-single", autoSolveNakedSingle);
	if (autoSolveNakedSingle) {
		autoSolve();
		setHistory();
		display()
	}
});
autoSolveNakedSubsetEle.addEventListener("change", () => {
	autoSolveNakedSubset = autoSolveNakedSubsetEle.checked;
	window.localStorage.setItem("sudoku-solver-auto-solve-naked-subset", autoSolveNakedSubset);
	if (autoSolveNakedSubset) {
		autoSolve();
		setHistory();
		display()
	}
});
autoSolveHiddenSingleEle.addEventListener("change", () => {
	autoSolveHiddenSingle = autoSolveHiddenSingleEle.checked;
	window.localStorage.setItem("sudoku-solver-auto-solve-hidden-single", autoSolveHiddenSingle);
	if (autoSolveHiddenSingle) {
		autoSolve();
		setHistory();
		display()
	}
});
autoSolvePointingNumbersEle.addEventListener("change", () => {
	autoSolveHiddenSingle = autoSolvePointingNumbersEle.checked;
	window.localStorage.setItem("sudoku-solver-auto-solve-pointing-numbers", autoSolvePointingNumbers);
	if (autoSolvePointingNumbers) {
		autoSolve();
		setHistory();
		display()
	}
});
multipleAnswerCheckEle.addEventListener("change", () => {
	multipleAnswerCheck = multipleAnswerCheckEle.checked;
	window.localStorage.setItem("sudoku-solver-multiple-answer-check", multipleAnswerCheck)
});
buttonReset.addEventListener("click", () => {
	resetGrid();
	setHistory();
	display()
});
buttonSolve.addEventListener("click", () => {
	solve()
});
buttonResetNotes.addEventListener("click", () => {
	resetNotes();
	setHistory();
	display()
});
document.addEventListener("click", e => {
	const td = e.target.closest("td.box");
	removeFocus();
	if (td) {
		const match = td.id.match(/^box(\d+)[-_](\d+)$/);
		if (match) {
			const x = Number(match[1]);
			const y = Number(match[2]);
			if (e.ctrlKey || e.metaKey) {
				if (focus.has(`${x},${y}`)) {
					focus.delete(`${x},${y}`)
				} else {
					focus.add(`${x},${y}`)
				}
			} else {
				focus.clear();
				focus.add(`${x},${y}`)
			}
			setFocus();
			return
		}
	}
	focus.clear()
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
		const oldFocus = new Set(focus);
		focus.clear();
		for (const pos of oldFocus) {
			let [x, y] = pos.split(",").map(Number);
			if (e.key === "ArrowUp") {
				if (x > 1) {
					x--
				}
			} else if (e.key === "ArrowDown") {
				if (x < 9) {
					x++
				}
			} else if (e.key === "ArrowLeft") {
				if (y > 1) {
					y--
				}
			} else {
				if (y < 9) {
					y++
				}
			}
			focus.add(`${x},${y}`)
		}
		removeFocus();
		setFocus()
	} else if (!e.repeat && focus.size > 0) {
		if (/^[1-9]$/.test(e.key)) {
			const num = Number(e.key);
			for (const pos of focus) {
				const [x, y] = pos.split(",").map(Number);
				if (grid[x - 1][y - 1].type === "guess" ? !grid[x - 1][y - 1].value[num - 1] : !posOk(x, y, num)) {
					continue
				}
				if (grid[x - 1][y - 1].type !== "guess") {
					addGuess(x, y)
				}
				grid[x - 1][y - 1] = {
					type: "number",
					value: num
				};
				removeGuess([`${x-1},${y-1}`])
			}
			autoSolve();
			setHistory();
			display()
		} else if (e.key === "Backspace" || e.key === "Delete") {
			for (const pos of focus) {
				const [x, y] = pos.split(",").map(Number);
				if (grid[x - 1][y - 1].type !== "guess") {
					addGuess(x, y)
				}
				grid[x - 1][y - 1] = {
					type: "guess",
					value: Array(9).fill(true)
				}
			}
			autoSolve();
			setHistory();
			display()
		}
	}
});
