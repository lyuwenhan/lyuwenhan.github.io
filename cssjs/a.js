function jump(){
	window.location.href = window.location.pathname.replace(/\/\/+/g,"/").replace(/\/[^/]+\/?$/, "/");
}