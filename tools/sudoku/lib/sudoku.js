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
let grid;

function resetGrid() {
	grid = Array.from({
		length: 9
	}, () => Array.from({
		length: 9
	}, () => ({
		isNumber: false,
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
	}) => i)
}

function getPositions(i, j) {
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
	positions.delete(`${i},${j}`);
	return Array.from(positions).map(s => s.split(",").map(Number))
}

function removeGuess(needUpdate) {
	let updated = false;
	needUpdate = needUpdate ? [...new Set(needUpdate)] : Array.from({
		length: 9
	}, (_, i) => Array.from({
		length: 9
	}, (_, j) => `${i},${j}`)).flat();
	needUpdate.map(update => update.split(",").map(Number)).forEach(([i, j]) => {
		const boxValue = grid[i][j];
		if (!boxValue.isNumber) {
			return
		}
		getPositions(i, j).forEach(([x, y]) => {
			if (!grid[x][y].isNumber && grid[x][y].value[boxValue.value]) {
				updated = true;
				grid[x][y].value[boxValue.value] = false
			}
		})
	});
	return updated
}

function solveNakedSingleAndSubset() {
	const solveSingle = autoSolveNakedSingle;
	const solveSubset = autoSolveNakedSubset;
	let updated = false;
	let thisUpdated;
	const needUpdate = [];
	do {
		thisUpdated = false;
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
		const toNumbered = grid.map(row => row.map(box => box.isNumber ? [] : boolToNumber(box.value)));
		const toNumberedStr = toNumbered.map(row => row.map(box => box.join(" ")));
		grid.forEach((row, i) => row.forEach((boxValue, j) => {
			if (boxValue.isNumber) {
				return
			}
			if (solveSingle && toNumbered[i][j].length === 1) {
				nakedSingle.push([i, j]);
				needUpdate.push(`${i},${j}`)
			} else if (solveSubset && toNumbered[i][j].length <= 4) {
				const numbers = toNumberedStr[i][j];
				const k = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				if (!rows[i][numbers]) {
					rows[i][numbers] = []
				}
				rows[i][numbers].push([i, j]);
				if (!cols[j][numbers]) {
					cols[j][numbers] = []
				}
				cols[j][numbers].push([i, j]);
				if (!blocks[k][numbers]) {
					blocks[k][numbers] = []
				}
				blocks[k][numbers].push([i, j])
			}
		}));
		nakedSingle.forEach(([i, j]) => {
			const boxValue = grid[i][j];
			boxValue.isNumber = true;
			boxValue.value = toNumbered[i][j][0]
		});
		rows.forEach((row, i) => {
			for (let guessStr in row) {
				let guess = guessStr.split(" ");
				const pos = row[guessStr];
				if (pos.length === guess.length) {
					grid[i].forEach((box, j) => {
						if (!box.isNumber) {
							if (toNumberedStr[i][j] !== guessStr) {
								guess.forEach(value => {
									if (box.value[value]) {
										box.value[value] = false;
										thisUpdated = true
									}
								})
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
						if (!box.isNumber) {
							if (toNumberedStr[i][j] !== guessStr) {
								guess.forEach(value => {
									if (box.value[value]) {
										box.value[value] = false;
										thisUpdated = true
									}
								})
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
							if (!box.isNumber) {
								if (toNumberedStr[i][j] !== guessStr) {
									guess.forEach(value => {
										if (box.value[value]) {
											box.value[value] = false;
											thisUpdated = true
										}
									})
								}
							}
						}
					}
				}
			}
		});
		if (needUpdate.length) {
			removeGuess(needUpdate);
			thisUpdated = true
		}
		if (thisUpdated) {
			updated = thisUpdated
		}
	} while (thisUpdated);
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
			if (!boxValue.isNumber) {
				const k = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				boxValue.value.forEach((isTrue, value) => {
					if (!isTrue) {
						return
					}
					rows[i][value].push([i, j]);
					cols[j][value].push([i, j]);
					blocks[k][value].push([i, j])
				})
			}
		}));
		rows.forEach(row => row.forEach((rowPositions, value) => {
			if (rowPositions.length === 1 && !grid[rowPositions[0][0]][rowPositions[0][1]].isNumber) {
				grid[rowPositions[0][0]][rowPositions[0][1]].isNumber = true;
				grid[rowPositions[0][0]][rowPositions[0][1]].value = value;
				needUpdate.push(`${rowPositions[0][0]},${rowPositions[0][1]}`)
			}
		}));
		cols.forEach(col => col.forEach((colPositions, value) => {
			if (colPositions.length === 1 && !grid[colPositions[0][0]][colPositions[0][1]].isNumber) {
				grid[colPositions[0][0]][colPositions[0][1]].isNumber = true;
				grid[colPositions[0][0]][colPositions[0][1]].value = value;
				needUpdate.push(`${colPositions[0][0]},${colPositions[0][1]}`)
			}
		}));
		blocks.forEach(block => block.forEach((blockPositions, value) => {
			if (blockPositions.length === 1 && !grid[blockPositions[0][0]][blockPositions[0][1]].isNumber) {
				grid[blockPositions[0][0]][blockPositions[0][1]].isNumber = true;
				grid[blockPositions[0][0]][blockPositions[0][1]].value = value;
				needUpdate.push(`${blockPositions[0][0]},${blockPositions[0][1]}`)
			}
		}));
		if (needUpdate.length > 0) {
			removeGuess(needUpdate);
			updated = true
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
			if (boxValue.isNumber) {
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
					const row = Math.floor(k / 3) * 3 + innerRow[0];
					for (let col = 0; col < 9; col++) {
						if (Math.floor(col / 3) === k % 3) {
							continue
						}
						if (!grid[row][col].isNumber && grid[row][col].value[number]) {
							grid[row][col].value[number] = false;
							thisUpdated = true
						}
					}
				}
			})
		});
		cols.forEach((block, k) => {
			block.forEach((valueBool, number) => {
				const innerCol = boolToNumber(valueBool);
				if (innerCol.length === 1) {
					const col = k % 3 * 3 + innerCol[0];
					for (let row = 0; row < 9; row++) {
						if (Math.floor(row / 3) === Math.floor(k / 3)) {
							continue
						}
						if (!grid[row][col].isNumber && grid[row][col].value[number]) {
							grid[row][col].value[number] = false;
							thisUpdated = true
						}
					}
				}
			})
		});
		if (thisUpdated) {
			updated = true
		}
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
	let boxValue = grid[i][j];
	if (!boxValue.isNumber) {
		return
	}
	getPositions(i, j).forEach(([x, y]) => {
		if (!grid[x][y].isNumber) {
			grid[x][y].value[boxValue.value] = true
		}
	})
}

function resetNotes() {
	grid.forEach(row => row.forEach(boxValue => {
		if (!boxValue.isNumber) {
			boxValue.value = Array(9).fill(true)
		}
	}));
	autoSolve()
}

function display() {
	boxes.forEach((row, i) => row.forEach((box, j) => {
		const boxValue = grid[i][j];
		box.innerHTML = "";
		if (!boxValue.isNumber) {
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
			numberEle.classList.add(`box-value-${boxValue.value+1}`);
			numberEle.innerText = boxValue.value + 1;
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

	function dfs(i, j) {
		if (i === 9) {
			answer.push(grid.map(row => row.map(boxValue => boxValue.value)));
			return
		}
		const nextY = (j + 1) % 9;
		const nextX = nextY === 0 ? i + 1 : i;
		if (grid[i][j].isNumber) {
			dfs(nextX, nextY);
			return
		}
		for (let number = 0; number < grid[i][j].value.length; number++) {
			if (answer.length >= triggerNumber) {
				return
			}
			if (!grid[i][j].value[number]) {
				continue
			}
			const k = Math.floor(i / 3) * 3 + Math.floor(j / 3);
			if (rows[i][number] || cols[j][number] || blocks[k][number]) {
				continue
			}
			rows[i][number] = true;
			cols[j][number] = true;
			blocks[k][number] = true;
			const boxValue = grid[i][j];
			grid[i][j] = {
				isNumber: true,
				value: number
			};
			dfs(nextX, nextY);
			rows[i][number] = false;
			cols[j][number] = false;
			blocks[k][number] = false;
			grid[i][j] = boxValue
		}
	}
	for (let i = 0; i < grid.length; i++) {
		for (let j = 0; j < grid[i].length; j++) {
			const boxValue = grid[i][j];
			if (boxValue.isNumber) {
				const k = Math.floor(i / 3) * 3 + Math.floor(j / 3);
				if (rows[i][boxValue.value] || cols[j][boxValue.value] || blocks[k][boxValue.value]) {
					alert("Preset numbers conflict.");
					return
				}
				rows[i][boxValue.value] = true;
				cols[j][boxValue.value] = true;
				blocks[k][boxValue.value] = true
			}
		}
	}
	dfs(0, 0);
	if (answer.length === 0) {
		alert("No solution.")
	} else if (answer.length === 1) {
		grid = answer[0].map(row => row.map(value => ({
			isNumber: true,
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
	if (prev.length > 300) {
		prev.shift()
	}
	prevI = prev.length - 1
}
setHistory();

function removeFocus() {
	document.querySelectorAll(".box.box-focus").forEach(e => e.classList.remove("box-focus"))
}

function setFocus() {
	for (const pos of focus) {
		const [x, y] = pos.split(",").map(Number);
		boxes[x]?.[y]?.classList?.add("box-focus")
	}
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
	autoSolvePointingNumbers = autoSolvePointingNumbersEle.checked;
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
			const x = Number(match[1]) - 1;
			const y = Number(match[2]) - 1;
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
	const t = e.target;
	if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable) {
		return
	}
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
	} else if (e.key.startsWith("Arrow") && focus.size > 0) {
		e.preventDefault();
		const oldFocus = new Set(focus);
		focus.clear();
		for (const pos of oldFocus) {
			let [x, y] = pos.split(",").map(Number);
			if (e.key === "ArrowUp") {
				if (x > 0) {
					x--
				}
			} else if (e.key === "ArrowDown") {
				if (x < 8) {
					x++
				}
			} else if (e.key === "ArrowLeft") {
				if (y > 0) {
					y--
				}
			} else {
				if (y < 8) {
					y++
				}
			}
			focus.add(`${x},${y}`)
		}
		removeFocus();
		setFocus()
	} else if (!e.repeat && focus.size > 0) {
		if (/^[1-9]$/.test(e.key)) {
			const num = Number(e.key) - 1;
			for (const pos of focus) {
				const [x, y] = pos.split(",").map(Number);
				if (grid[x][y].isNumber) {
					continue
				}
				if (!grid[x][y].value[num]) {
					continue
				}
				grid[x][y] = {
					isNumber: true,
					value: num
				};
				removeGuess([`${x},${y}`])
			}
			autoSolve();
			setHistory();
			display()
		} else if (e.key === "Backspace" || e.key === "Delete") {
			for (const pos of focus) {
				const [x, y] = pos.split(",").map(Number);
				if (grid[x][y].isNumber) {
					addGuess(x, y)
				}
				grid[x][y] = {
					isNumber: false,
					value: Array(9).fill(true)
				}
			}
			autoSolve();
			setHistory();
			display()
		}
	}
});
