/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

// Listen for changes to local storage and update registered stores
// TODO

export function createIndexedDBStore (key, default_value=null) {

	const { subscribe, set, update } = writable(default_value);

	if (typeof window === 'undefined') {
		throw new Error('IndexedDB storage can only be used in the browser');
	}

	// TODO Switch over to IndexedDB

	// Prime the store with the value from local storage, if any
	const local_value = localStorage.getItem(key);
	if (local_value !== null) {
		set(JSON.parse(local_value));
	} else {
		// If nothing in local storage, set the default value
		localStorage.setItem(key, JSON.stringify(default_value));
	}

	// Register this store for updates to local storage
	//  - this way, when we subscribe to changes, we get changes from other tabs
	// TODO - we could use local storage to send events - eg. keys with updated_at...

	return {
		subscribe,
		set: function (value) {
			localStorage.setItem(key, JSON.stringify(value));
			set(value);
		},
		update: function (callback) {
			const local_value = localStorage.getItem(key);
			const updated_value = callback(JSON.parse(local_value));
			this.set(updated_value);
		}
	}
}
