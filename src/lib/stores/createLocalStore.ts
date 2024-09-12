/**
 * Use this function to create a new local storage store
 */

import { writable } from 'svelte/store';

// Listen for changes to local storage and update registered stores
// TODO

export function createLocalStore (key, default_value=null) {

	const { subscribe, set } = writable(default_value);

	if (typeof window === 'undefined') {
		throw new Error('Local storage can only be used in the browser');
	}

	const store_interface = {
		subscribe: function (callback, invalidate=null) {
			return subscribe(function (value_string) {
				// Parse the JSON since that's how we store the value - see '.set'
				const value = JSON.parse(value_string);
				return callback(value);
			}, invalidate);
		},
		set: function (value) {
			const value_string = JSON.stringify(value);
			console.log('LocalStore.set:', key, value_string);
			// We store the value as a JSON string in the store as well
			// to avoid issues with updates via other references to the object
			localStorage.setItem(key, value_string);
			set(value_string);
		},
		update: function (callback) {
			console.log('LocalStore.update:', key, value);
			const local_value = localStorage.getItem(key);
			const updated_value = callback(JSON.parse(local_value));
			this.set(updated_value);
		}
	};

	// Prime the store with the value from local storage, if any
	const local_value_raw = localStorage.getItem(key);

	if (local_value_raw !== null) {
		const local_value = JSON.parse(local_value_raw);
		store_interface.set(local_value);
		if (key === 'sync') {
			console.log('Localstore sync loaded from local storage:', local_value_raw, local_value);
		}
	} else {
		// If nothing in local storage, set the default value
		localStorage.setItem(key, JSON.stringify(default_value));
		if (key === 'sync') {
			console.log('Localstore sync set local storage:', local_value);
		}
	}

	// TODO - Register this store for updates to local storage?
	// In theory this could allow for useful multi-tab behaviors
	// Might need a lot of testing

	return store_interface;
}
