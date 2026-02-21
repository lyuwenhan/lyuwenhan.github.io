const mineArea = document.getElementById("mineArea");
const statEle = document.getElementById("stat");
const boom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 416 416"><path d="m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z" fill="#000000"/></svg>`;
const flag = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,8,8"><g><path xmlns="http://www.w3.org/2000/svg" stroke-width="0" stroke="none" fill="#ffffff" d="M0,0 0,8 8,8 8,0"></path><path xmlns="http://www.w3.org/2000/svg" fill="#b3b3b3" stroke-width="0" stroke="none" d="M1,0 1,8 2,8 2,0"></path><path stroke="none" fill="#e70000" d="M2,0 7,2 2,4"></path></g></svg>`;
mineArea.addEventListener("contextmenu", e => {
	e.preventDefault()
}, true);

function validSize(n) {
	return Math.max(4, Math.min(1e3, +n || 5))
}
var width = validSize(window.localStorage.getItem("minesweeper-width"));
var height = validSize(window.localStorage.getItem("minesweeper-height"));
let mine;

function setWidth(w) {
	mine = Math.floor(width * height * .2);
	width = validSize(w);
	window.localStorage.setItem("minesweeper-width", width)
}

function setHeight(h) {
	mine = Math.floor(width * height * .2);
	height = validSize(h);
	window.localStorage.setItem("minesweeper-height", height)
}

function setSize(w, h) {
	setWidth(w);
	setHeight(h)
}
setSize(window.localStorage.getItem("minesweeper-width"), validSize(window.localStorage.getItem("minesweeper-height")));
var map;
var disp;
var oper = [];
var oper2 = [];
let opening = false;
let stat = false;
let changed = new Set;
let dir = [
	[0, 1],
	[1, 1],
	[1, 0],
	[1, -1],
	[0, -1],
	[-1, -1],
	[-1, 0],
	[-1, 1]
];

function valid(x, y) {
	return x >= 0 && y >= 0 && x < width && y < height
}

function getAround(x, y) {
	let air = 0,
		flag = 0,
		number = 0;
	dir.forEach(([dx, dy]) => {
		const nx = x + dx;
		const ny = y + dy;
		if (valid(nx, ny)) {
			if (disp[nx][ny] === -3) {
				air++
			} else if (disp[nx][ny] === -2) {
				flag++
			} else if (disp[nx][ny] >= 0) {
				number++
			}
		}
	});
	return {
		air,
		flag,
		number
	}
}

function showNumber(mineEle2, num, x, y) {
	if (num === -1) {
		mineEle2.innerHTML = boom
	} else if (num === -2) {
		mineEle2.innerHTML = flag
	} else if (num >= 0) {
		mineEle2.innerText = num;
		const {
			flag
		} = getAround(x, y);
		if (flag < num) {
			mineEle2.classList.add("mine-norm")
		} else if (flag === num) {
			mineEle2.classList.add("mine-good")
		} else {
			mineEle2.classList.add("mine-bad")
		}
	}
}

function doDie() {
	stat = 3;
	disp.forEach((row, i) => {
		row.forEach((num, j) => {
			disp[i][j] = map[i][j]
		})
	})
}

function doOpen(x, y) {
	if (disp[x][y] === -2) {
		return false
	} else if (map[x][y] === -1) {
		doDie()
	} else {
		disp[x][y] = map[x][y];
		if (disp[x][y] === 0) {
			dir.forEach(([dx, dy]) => {
				const nx = x + dx;
				const ny = y + dy;
				if (valid(nx, ny) && disp[nx][ny] === -3) {
					actionAdd(x + dx, y + dy, 1)
				}
			})
		}else{
			action2Add(x, y);
		}
		dir.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;
			if (valid(nx, ny) && disp[nx][ny] >= 0) {
				action2Add(x + dx, y + dy)
			}
		});
		actionAct()
	}
	return true
}

function doFlag(x, y) {
	if (disp[x][y] === -2 || disp[x][y] === -3) {
		disp[x][y] = -5 - disp[x][y];
		dir.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;
			if (valid(nx, ny)) {
				if (disp[nx][ny] >= 0) {
					action2Add(x + dx, y + dy)
				}
			}
		});
		actionAct();
		return true
	}
	return false
}

function doCheck(x, y) {
	const {
		flag,
		air
	} = getAround(x, y);
	let change = false;
	if (disp[x][y] === flag) {
		dir.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;
			if (valid(nx, ny) && disp[nx][ny] === -3) {
				change = true;
				actionAdd(x + dx, y + dy, 1)
			}
		})
	} else if (disp[x][y] === flag + air) {
		dir.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;
			if (valid(nx, ny) && disp[nx][ny] === -3) {
				change = true;
				actionAdd(x + dx, y + dy, 2)
			}
		})
	}
	if (change) {
		action2Add(x, y);
		actionAct()
	}
	return change
}

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]]
	}
	return arr
}

function setMine(x, y) {
	const excluded = new Set;
	excluded.add(`${x},${y}`);
	for (const [dx, dy] of dir) {
		const nx = x + dx;
		const ny = y + dy;
		if (valid(nx, ny)) {
			excluded.add(`${nx},${ny}`)
		}
	}
	const result = [];
	for (let j = 0; j < height; j++) {
		for (let i = 0; i < width; i++) {
			const key = `${i},${j}`;
			if (!excluded.has(key)) {
				result.push({
					x: i,
					y: j
				})
			}
		}
	}
	mine = Math.min(mine, result.length);
	shuffle(result);
	result.length = mine;
	result.forEach(({
		x,
		y
	}) => {
		map[x][y] = -1
	});
	map.forEach((row, i) => {
		for (let j = 0; j < row.length; j++) {
			if (row[j] >= 0) {
				row[j] = 0;
				dir.forEach(([x, y]) => {
					if (valid(i + x, j + y) && map[i + x][j + y] === -1) {
						row[j]++
					}
				})
			}
		}
	})
}

function actionAct() {
	if (stat >= 3) {
		return
	}
	if (opening) return;
	opening = true;
	let change = false;
	while (oper.length > 0 || oper2.length > 0) {
		if (oper.length > 0) {
			let {
				x,
				y,
				act
			} = oper.shift();
			if (stat <= 0) {
				stat = 1;
				act = 1;
				setMine(x, y)
			}
			if (act === 2) {
				change = doFlag(x, y) || change
			} else {
				change = doOpen(x, y) || change
			}
			if (stat >= 3) {
				oper.length = 0;
				oper2.length = 0;
				break
			}
		} else {
			let {
				x,
				y
			} = oper2.shift();
			change = doCheck(x, y) || change;
			if (stat >= 3) {
				oper.length = 0;
				oper2.length = 0;
				break
			}
		}
	}
	opening = false;
	if (change) {
		display()
	}
}

function actionAdd(x, y, act) {
	if (stat >= 3) {
		return
	}
	if (!valid(x, y)) {
		return
	}
	oper.push({
		x,
		y,
		act
	})
}

function action2Add(x, y) {
	if (stat >= 3) {
		return
	}
	if (!valid(x, y)) {
		return
	}
	oper2.push({
		x,
		y
	})
}

function action(x, y, act) {
	actionAdd(x, y, act);
	actionAct()
}

function action2(x, y, act) {
	action2Add(x, y, act);
	actionAct()
}

function display() {
	let fin = stat === 1;
	mineArea.innerHTML = "";
	disp.forEach((row, i) => {
		const rowEle = document.createElement("tr");
		row.forEach((num, j) => {
			if (fin && num === -3 && map[i][j] >= 0) {
				fin = false
			}
			const colEle = document.createElement("td");
			colEle.classList.add("mineEle");
			const mineEle2 = document.createElement("span");
			mineEle2.classList.add("mineEle2");
			showNumber(mineEle2, num, i, j);
			colEle.addEventListener("pointerdown", e => {
				if (e.button === 0) {
					action(i, j, 1);
					e.preventDefault()
				} else if (e.button === 2) {
					action(i, j, 2);
					e.preventDefault()
				}
			});
			colEle.append(mineEle2);
			rowEle.append(colEle)
		});
		mineArea.append(rowEle)
	});
	if (fin) {
		stat = 2
	}
}

function reset() {
	stat = 0;
	map = Array.from({
		length: width
	}, () => Array.from({
		length: height
	}, () => 0));
	disp = Array.from({
		length: width
	}, () => Array.from({
		length: height
	}, () => -3));
	display()
}
reset();
