function jump() {
	var currentPath = window.location.pathname;
	var newUrl = "https://lanpingzhong-fishing.github.io" + currentPath;
	window.location.href = newUrl;
	return false;
}
function get() {
	$.getJSON('https://lyuwenhan.github.io/file/fishing.json', function(jsonData) {
		console.log('Received data:', jsonData);
		var fileList = jsonData.file;
		var contributionElement = document.querySelector('.contribution');
		fileList.forEach(function(file) {
		  var linkElement = document.createElement('a');
		  linkElement.textContent = file.name;
		  linkElement.href = file.path;
		  contributionElement.parentNode.insertBefore(linkElement, contributionElement);
		  contributionElement.parentNode.insertBefore(document.createElement('br'), contributionElement);
		});
	})
}