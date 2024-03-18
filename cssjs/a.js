function jump() {
	var currentPath = window.location.pathname;
	var newUrl = "https://lanpingzhong-fishing.github.io" + currentPath;
	window.location.href = newUrl;
	return false;
}
function remove_to_back(url) {
    var segments = url.split('/');
    if (segments.length <= 1) {
        return url;
    }
    segments.pop();
    return segments.join('/');
}

function jump_back() {
	var currentPath = window.location.href;
	console.log(remove_to_back(remove_to_back(currentPath)));
	window.location.href = "https://lyuwenhan.github.io" + remove_to_back(remove_to_back(currentPath));
	return false;
}