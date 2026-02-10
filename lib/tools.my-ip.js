fetch("https://my-ip.lyuwenhan.workers.dev/").then(res => res.text()).then(text => {
	document.getElementById("ip").textContent = text
}).catch(err => {
	document.getElementById("ip").textContent = "Error";
	console.error(err)
});
