function jump() {
	var currentPath = window.location.pathname;
	var newUrl = "https://lanpingzhong-fishing.github.io" + currentPath;
	window.location.href = newUrl;
	return false; // 防止链接的默认行为（即跳转到锚点）
}
function get() {
	$.getJSON('https://lyuwenhan.github.io/file/fishing.json', function(data) {
	  // 在请求成功后执行的回调函数
	  console.log('Received data:', data);
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
	  // 在请求失败时执行的回调函数
	  console.error('Error fetching data:', textStatus, errorThrown);
	});
}