if(window.localStorage.getItem("ag") !== "true"){
	if(!/^\/disclaimer\/?$/.test(location.pathname)){
		location.href = '/disclaimer/';
	}
}