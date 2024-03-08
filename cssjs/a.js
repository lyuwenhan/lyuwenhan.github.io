function jump() {
	var currentPath = window.location.pathname;
	var newUrl = "https://lanpingzhong-fishing.github.io" + currentPath;
	window.location.href = newUrl;
	return false; // 防止链接的默认行为（即跳转到锚点）
}