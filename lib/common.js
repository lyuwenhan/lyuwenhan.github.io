if(window.localStorage.getItem("ag") !== "true"){
	if(!/^\/disclaimer\/?$/.test(location.pathname)){
		location.pathname = '/disclaimer/';
	}
}