function jump() {
	var currentPath = window.location.pathname;
	var newUrl = "https://lanpingzhong-fishing.github.io" + currentPath;
	window.location.href = newUrl;
	return false;
}