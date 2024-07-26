export const util = {

	isObject: thing => thing && typeof thing === 'object' && thing.constructor === Object,

	/**
	 * Promise factory - to wait for a window var to be defined
	 * - Eg. for waiting for third-party scripts to load and initialize
	 * - Takes varname to look for, and maxSecondsToWait (before throwing an error)
	 */
	newWindowVarPromise: function (varname, maxSecondsToWait = 300) {
		return new Promise(function (resolve, reject) {
			const maxMillisecondsToWait = maxSecondsToWait * 1000;
			const millisecondsPerInterval = 100;
			let millisecondsWaited = 0;

			const interval = window.setInterval(function () {
				millisecondsWaited += millisecondsPerInterval;
				if (varname in window) {
					window.clearInterval(interval);
					resolve(window[varname]);
				} else if (millisecondsWaited > maxMillisecondsToWait) {
					reject(
						`Waited ${maxSecondsToWait} second(s) and '${varname}' didn't show up on window object.`
					);
				}
			}, millisecondsPerInterval);
		});
	}
};
