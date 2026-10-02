const SIZE = 256;
const PADDING = 16;
const TEXT_WIDTH = SIZE - PADDING * 2;
const LINE_HEIGHT_RATIO = 1.25;
const FONT_FAMILY = "Consolas, Courier, monospace";
const textInput = document.getElementById("textInput");
const fontSizeInput = document.getElementById("fontSizeInput");
const foregroundInput = document.getElementById("foregroundInput");
const svgImage = document.getElementById("svgImage");
const measureCanvas = document.createElement("canvas");
const measureContext = measureCanvas.getContext("2d");
textInput.value = localStorage.getItem("text") ?? textInput.value;
fontSizeInput.value = localStorage.getItem("fontSize") ?? "24";
foregroundInput.value = localStorage.getItem("foreground") ?? "#000000";

function getFontSize() {
	const value = Number(fontSizeInput.value);
	return value > 0 ? value : 24
}

function measureText(text) {
	measureContext.font = `${getFontSize()}px ${FONT_FAMILY}`;
	return measureContext.measureText(text).width
}

function fits(text) {
	return measureText(text) <= TEXT_WIDTH
}

function greedyWrap(words) {
	const lines = [];
	let current = "";
	for (const word of words) {
		const test = current ? `${current} ${word}` : word;
		if (!current || fits(test)) {
			current = test
		} else {
			lines.push(current);
			current = word
		}
	}
	if (current) {
		lines.push(current)
	}
	return lines
}

function calculateScore(lines) {
	if (lines.length <= 1) {
		return 0
	}
	const widths = lines.map(measureText);
	const average = widths.reduce((sum, width) => sum + width, 0) / widths.length;
	return widths.reduce((score, width) => {
		const difference = width - average;
		return score + difference * difference
	}, 0)
}

function balancedWrap(words, targetLineCount) {
	const count = words.length;
	const dp = Array.from({
		length: count + 1
	}, () => Array(targetLineCount + 1).fill(null));
	dp[0][0] = {
		score: 0,
		lines: []
	};
	for (let start = 0; start < count; start++) {
		for (let used = 0; used < targetLineCount; used++) {
			const state = dp[start][used];
			if (!state) {
				continue
			}
			let line = "";
			for (let end = start; end < count; end++) {
				line = line ? `${line} ${words[end]}` : words[end];
				if (!fits(line)) {
					break
				}
				const nextIndex = end + 1;
				const nextUsed = used + 1;
				const lines = [...state.lines, line];
				const score = calculateScore(lines);
				const existing = dp[nextIndex][nextUsed];
				if (!existing || score < existing.score) {
					dp[nextIndex][nextUsed] = {
						score,
						lines
					}
				}
			}
		}
	}
	return dp[count][targetLineCount]?.lines ?? null
}

function wrapText(text) {
	const trimmed = text.trim();
	if (!trimmed) {
		return [""]
	}
	const words = trimmed.split(/\s+/).filter(Boolean);
	if (words.length === 1) {
		return [words[0]]
	}
	const greedy = greedyWrap(words);
	const balanced = balancedWrap(words, greedy.length);
	return balanced ?? greedy
}

function escapeXml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function buildSvg() {
	const fontSize = getFontSize();
	const lineHeight = fontSize * LINE_HEIGHT_RATIO;
	const foreground = foregroundInput.value;
	const lines = wrapText(textInput.value);
	const startY = SIZE / 2 - (lines.length - 1) * lineHeight / 2;
	const textElements = lines.map((line, index) => `<text x="128" y="${startY+index*lineHeight}">${escapeXml(line)}</text>`).join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><g text-anchor="middle" font-family="Consolas, Courier, monospace" font-size="${fontSize}" fill="${foreground}" dominant-baseline="middle">${textElements}</g></svg>`
}

function renderSvg() {
	localStorage.setItem("text", textInput.value);
	localStorage.setItem("foreground", foregroundInput.value);
	const fontSize = Number(fontSizeInput.value);
	if (fontSize > 0) {
		localStorage.setItem("fontSize", fontSizeInput.value)
	}
	svgImage.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildSvg())
}
textInput.addEventListener("input", renderSvg);
fontSizeInput.addEventListener("input", renderSvg);
foregroundInput.addEventListener("input", renderSvg);
renderSvg();
const downloadSvg = document.getElementById("downloadSvg");
const copySvg = document.getElementById("copySvg");
const downloadPng = document.getElementById("downloadPng");
const copyPng = document.getElementById("copyPng");

function getSvgBlob() {
	return new Blob([buildSvg()], {
		type: "image/svg+xml"
	})
}

function svgToPngBlob() {
	return new Promise(resolve => {
		const image = new Image;
		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = SIZE;
			canvas.height = SIZE;
			canvas.getContext("2d").drawImage(image, 0, 0);
			canvas.toBlob(resolve, "image/png")
		};
		image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildSvg())
	})
}

function saveBlob(blob, name) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url)
}
downloadSvg.addEventListener("click", () => {
	saveBlob(getSvgBlob(), "text.svg")
});
copySvg.addEventListener("click", () => {
	navigator.clipboard.writeText(buildSvg())
});
downloadPng.addEventListener("click", async () => {
	saveBlob(await svgToPngBlob(), "text.png")
});
copyPng.addEventListener("click", async () => {
	await navigator.clipboard.write([new ClipboardItem({
		"image/png": await svgToPngBlob()
	})])
});
