const thing1_1 = document.getElementById("thing1-1");
const result1_1 = document.getElementById("result1-1");
const result1_2 = document.getElementById("result1-2");
const thing2_1 = document.getElementById("thing2-1");
const thing2_2 = document.getElementById("thing2-2");
const result2_1 = document.getElementById("result2-1");
const thing3_1 = document.getElementById("thing3-1");
const thing3_2 = document.getElementById("thing3-2");
const result3_1 = document.getElementById("result3-1");
const thing4_1 = document.getElementById("thing4-1");
const result4_1 = document.getElementById("result4-1");
const result4_2 = document.getElementById("result4-2");

function goodVal(val) {
	return Math.max(0, Math.floor(Number(val) || 0))
}

function setValue(ele, value) {
	ele.value = value ? value : "";
}

function update1() {
	if (!thing1_1.value) {
		result1_1.value = "";
		result1_2.value = "";
		return
	}
	const val = goodVal(thing1_1.value);
	setValue(thing1_1, val);
	result1_1.value = Math.floor(val / 64);
	result1_2.value = val % 64
}
thing1_1.addEventListener("input", update1);

function update2() {
	if (!thing2_1.value && !thing2_2.value) {
		result2_1.value = "";
		return
	}
	const val1 = goodVal(thing2_1.value);
	const val2 = goodVal(thing2_2.value);
	setValue(thing2_1, val1);
	setValue(thing2_2, val2);
	result2_1.value = val1 * 64 + val2
}
thing2_1.addEventListener("input", update2);
thing2_2.addEventListener("input", update2);

function update3() {
	if (!thing3_1.value && !thing3_2.value) {
		result3_1.value = "";
		return
	}
	const val1 = goodVal(thing3_1.value);
	const val2 = goodVal(thing3_2.value);
	setValue(thing3_1, val1);
	setValue(thing3_2, val2);
	result3_1.value = val1 * 4 + val2
}
thing3_1.addEventListener("input", update3);
thing3_2.addEventListener("input", update3);

function update4() {
	if (!thing4_1.value) {
		result4_1.value = "";
		result4_2.value = "";
		return
	}
	const val = goodVal(thing4_1.value);
	setValue(thing4_1, val);
	result4_1.value = Math.floor(val / 4);
	result4_2.value = val % 4
}
thing4_1.addEventListener("input", update4);
