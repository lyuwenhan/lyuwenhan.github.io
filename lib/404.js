if (/^\/extensions\/[a-zA-Z\d_\-]+\/data\//.test(window.location.pathname)) {
	window.location.replace(window.location.pathname.replace(/^(\/extensions\/[a-zA-Z\d_\-]+)\/.*$/, "$1"))
}else {
	window.location.replace(new URL("..", window.location.href))
}
