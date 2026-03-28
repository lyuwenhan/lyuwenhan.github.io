if (window.location.pathname.startsWith("/extensions/")) {
	window.location.replace(new URL("..", window.location.href))
}
