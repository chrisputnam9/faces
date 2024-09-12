export const util = {

	areSamish: (a, b) => JSON.stringify(a) === JSON.stringify(b),

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
	},

	noop: () => {},

	// Clone an object
	objectClone: object => JSON.parse(JSON.stringify(object)),

	/**
	 * Compare two objects by converting to JSON
	 */
	objectsSame: (object, otherObject) =>
		JSON.stringify(object) === JSON.stringify(otherObject),
	objectsDiffer: (object, otherObject) => !util.objectsSame(object, otherObject),

	/**
	 * Get a timestamp
	 */
	timestamp: () => new Date().getTime()
};
